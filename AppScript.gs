/* ============
 Material Stock Management - Apps Script (MVP) - Robust version
 Replace existing Code.gs with this file
 ============ */

/* CONFIG - sheet names (change only if you renamed sheets) */
const SS = SpreadsheetApp.getActiveSpreadsheet();
const SHEETS = {
  MATERIALS: 'Materials',
  TRANSACTIONS: 'Transactions',
  USERS: 'Users',
  WAREHOUSES: 'Warehouses',
  SETTINGS: 'Settings'
};

/* ===== Helpers ===== */

// Ensure required sheets exist. Returns array of missing sheet names (empty if all OK)
function validateRequiredSheets() {
  const missing = [];
  for (const key in SHEETS) {
    const name = SHEETS[key];
    if (!SS.getSheetByName(name)) missing.push(name);
  }
  return missing;
}

// Throw a clear error if any required sheet is missing
function ensureSheetsOrThrow() {
  const missing = validateRequiredSheets();
  if (missing.length > 0) {
    throw new Error('Missing required sheet(s): ' + missing.join(', ') +
      '.\nCreate these sheets with the exact names and headers before running the script.');
  }
}

/**
 * Read a whole sheet as array of objects (header-driven)
 * Ignores completely empty rows
 * @param {string} sheetName - Name of the sheet
 * @returns {Array<Object>} - Array of objects representing each non-empty row
 */
function sheetToObjects(sheetName) {
  const sh = SS.getSheetByName(sheetName);
  if (!sh) {
    throw new Error("Sheet not found: " + sheetName);
  }

  const values = sh.getDataRange().getValues();
  if (values.length < 2) return []; // no data

  const headers = values[0].map(h => String(h).trim()); // first row = headers
  const objects = [];

  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    let isEmpty = true;
    const obj = {};

    row.forEach((cell, idx) => {
      const value = cell;
      obj[headers[idx] || ('col' + idx)] = value;
      if (String(value).trim() !== "") isEmpty = false;
    });

    if (!isEmpty) objects.push(obj); // only include non-empty rows
  }

  return objects;
}

function getSheet(name) {
  const sh = SS.getSheetByName(name);
  if (!sh) throw new Error('getSheet: sheet not found: ' + name);
  return sh;
}

// Get user role from Users sheet. Returns role string or null
function getUserRole(userEmail) {
  if (!userEmail) return null;
  const sh = getSheet(SHEETS.USERS);
  const lastRow = Math.max(sh.getLastRow(), 1);
  if (lastRow < 2) return null;
  const values = sh.getRange(2, 1, lastRow - 1, 2).getValues();
  for (let i = 0; i < values.length; i++) {
    if (String(values[i][0]).trim().toLowerCase() === String(userEmail).trim().toLowerCase()) {
      return String(values[i][1]).trim().toLowerCase();
    }
  }
  return null;
}

/* ===== onEdit timestamps ===== */
function onEdit(e) {
  try {
    const missing = validateRequiredSheets();
    if (missing.length) return;

    const range = e.range;
    const sh = range.getSheet();
    if (!sh || sh.getName() !== SHEETS.MATERIALS) return;

    const row = range.getRow();
    const col = range.getColumn();
    if (row === 1) return; // header row

    const headers = sh
      .getRange(1, 1, 1, sh.getLastColumn())
      .getValues()[0]
      .map(h => String(h).trim());

    const createdAtCol = headers.indexOf('created_at') + 1;
    const updatedAtCol = headers.indexOf('updated_at') + 1;
    const stockOkCol = headers.indexOf('stock_ok') + 1;

    if (!createdAtCol || !updatedAtCol) return;

    // 🚫 Ignore edits to system-managed columns
    if ([createdAtCol, updatedAtCol, stockOkCol].includes(col)) {
      return;
    }

    // 🚫 Ignore completely empty material rows
    const materialCodeCol = headers.indexOf('material_code') + 1;
    const materialCode = sh.getRange(row, materialCodeCol).getValue();
    if (!materialCode) return;

    const now = new Date();

    // Set created_at only once
    const createdCell = sh.getRange(row, createdAtCol);
    if (!createdCell.getValue()) {
      createdCell.setValue(now);
    }

    // Always update updated_at on valid data edits
    sh.getRange(row, updatedAtCol).setValue(now);

  } catch (err) {
    console.error('onEdit error', err);
  }
}

/* ===== Settings helpers (txn id) ===== */
function getNextTxnId() {
  ensureSheetsOrThrow();
  const sh = getSheet(SHEETS.SETTINGS);
  const lastRow = Math.max(sh.getLastRow(), 1);
  const values = sh.getRange(1, 1, lastRow, 2).getValues();
  for (let i = 0; i < values.length; i++) {
    if (String(values[i][0]).trim() === 'next_txn_id') {
      const n = parseInt(values[i][1], 10);
      if (isNaN(n)) throw new Error('Invalid next_txn_id in Settings (not a number)');
      sh.getRange(i + 1, 2).setValue(n + 1);
      return 'TXN' + String(n);
    }
  }
  // create default if missing
  sh.appendRow(['next_txn_id', 2]);
  return 'TXN0001';
}

/* ===== Settings helpers (dc no) ===== */
function getNextDcNo(increment = false) {
  ensureSheetsOrThrow();
  const sh = getSheet(SHEETS.SETTINGS);
  const lastRow = Math.max(sh.getLastRow(), 1);
  const values = sh.getRange(1, 1, lastRow, 2).getValues();
  for (let i = 0; i < values.length; i++) {
    if (String(values[i][0]).trim() === 'next_dc_no') {
      const n = parseInt(values[i][1], 10);
      if (isNaN(n)) throw new Error('Invalid next_dc_no in Settings (not a number)');
      if (increment == true) {
        sh.getRange(i + 1, 2).setValue(n + 1);
      }
      return String(n);
    }
  }
  // create default if missing
  sh.appendRow(['next_dc_no', 2]);
  return '1';
}

/* ===== Core operations ===== */
function createTransaction(data) {
  ensureSheetsOrThrow();
  if (!data || !data.action) throw new Error('Invalid data: missing action');
  if (!data.material_code && data.action !== 'add_material' && data.action !== 'transfer_stock_bulk') {
    throw new Error('material_code is required for this action');
  }
  const userEmail = data.user_email || '';
  const role = getUserRole(userEmail);
  if (!role) throw new Error('Unauthorized: user not found in Users sheet (' + userEmail + ')');

  if (role !== 'manager') {
    if (data.action === 'add_material' || data.action === 'adjust_stock') {
      throw new Error('Forbidden: only manager can perform this action');
    }
  }

  const transactionsSh = getSheet(SHEETS.TRANSACTIONS);
  const materialsSh = getSheet(SHEETS.MATERIALS);
  const headersMaterials = materialsSh.getRange(1, 1, 1, materialsSh.getLastColumn()).getValues()[0].map(h => String(h).trim());
  const now = new Date();
  const txnId = getNextTxnId();

  function findMaterialRow(material_code, warehouse_id) {
    if (!material_code || !warehouse_id) return -1;
    const colMaterial = headersMaterials.indexOf('material_code') + 1;
    const colWarehouse = headersMaterials.indexOf('warehouse_id') + 1;
    const lastRow = materialsSh.getLastRow();
    if (lastRow < 2) return -1;
    const matColVals = materialsSh.getRange(2, colMaterial, lastRow - 1).getValues().flat();
    const whColVals = materialsSh.getRange(2, colWarehouse, lastRow - 1).getValues().flat();
    for (let i = 0; i < matColVals.length; i++) {
      if (String(matColVals[i]) === String(material_code) && String(whColVals[i]) === String(warehouse_id)) {
        return i + 2;
      }
    }
    return -1;
  }

  function updateMaterialStock(material_code, warehouse_id, delta, extra) {
    const r = findMaterialRow(material_code, warehouse_id);
    const colStock = headersMaterials.indexOf('current_stock') + 1;
    const colUpdated = headersMaterials.indexOf('updated_at') + 1;
    const colCreated = headersMaterials.indexOf('created_at') + 1;
    if (r === -1) {
      if (delta >= 0) {
        // build new row using header ordering
        const allMaterials = sheetToObjects(SHEETS.MATERIALS);
        let materialName = '';
        let unitVal = '';
        for (let m of allMaterials) {
          if (String(m.material_code) === String(material_code)) {
            materialName = m.material_name || '';
            unitVal = m.unit || '';
            break;
          }
        }
        if (extra && extra.material_name) materialName = extra.material_name;
        if (extra && extra.unit) unitVal = extra.unit;

        const newRow = [];
        for (let i = 0; i < headersMaterials.length; i++) {
          const h = headersMaterials[i];
          if (h === 'material_code') newRow.push(material_code);
          else if (h === 'material_name') newRow.push(materialName);
          else if (h === 'unit') newRow.push(unitVal);
          else if (h === 'warehouse_id') newRow.push(warehouse_id);
          else if (h === 'current_stock') newRow.push(delta);
          else if (h === 'created_at') newRow.push(now);
          else if (h === 'updated_at') newRow.push(now);
          else newRow.push('');
        }
        materialsSh.appendRow(newRow);
        return;
      } else {
        throw new Error('Insufficient stock: material not found at source location (' + material_code + ' @ ' + warehouse_id + ')');
      }
    } else {
      const current = Number(materialsSh.getRange(r, colStock).getValue()) || 0;
      const updated = current + delta;
      if (updated < 0) throw new Error('Insufficient stock: would become negative at ' + warehouse_id);
      materialsSh.getRange(r, colStock).setValue(updated);
      materialsSh.getRange(r, colUpdated).setValue(now);
    }
  }

  const qty = Number(data.quantity || 0);
  if (isNaN(qty)) {
    throw new Error('Invalid quantity');
  }

  // Actions
  if (data.action === 'add_material') {
    const hdrs = headersMaterials;
    const newRow = [];
    for (let i = 0; i < hdrs.length; i++) {
      const h = hdrs[i];
      if (h === 'material_code') newRow.push(data.material_code || '');
      else if (h === 'material_name') newRow.push(data.material_name || '');
      else if (h === 'unit') newRow.push(data.unit || '');
      else if (h === 'warehouse_id') newRow.push(data.warehouse_id || '');
      else if (h === 'current_stock') newRow.push(qty || 0);
      else if (h === 'created_at' || h === 'updated_at') newRow.push(now);
      else newRow.push('');
    }
    materialsSh.appendRow(newRow);
    if (qty > 0) {
      transactionsSh.appendRow([txnId, data.material_code, 'IN', qty, '', data.warehouse_id, data.user_email, data.remarks || '', now]);
    }
    updateStockStatus();
    return { success: true, txn_id: txnId };
  }

  if (data.action === 'stock_in') {
    if (!data.to_warehouse) throw new Error('to_warehouse required for stock_in');
    updateMaterialStock(data.material_code, data.to_warehouse, qty, data.extra);
    transactionsSh.appendRow([txnId, data.material_code, 'IN', qty, '', data.to_warehouse, data.user_email, data.remarks || '', now]);
    updateStockStatus();
    return { success: true, txn_id: txnId };
  }

  if (data.action === 'stock_out' || data.action === 'stock_used') {
    if (!data.from_warehouse) throw new Error('from_warehouse required for stock_out');
    updateMaterialStock(data.material_code, data.from_warehouse, -Math.abs(qty));
    const txType = data.action === 'stock_used' ? 'USED' : 'OUT';
    transactionsSh.appendRow([txnId, data.material_code, txType, qty, data.from_warehouse, '', data.user_email, data.remarks || '', now]);
    updateStockStatus();
    return { success: true, txn_id: txnId };
  }

  if (data.action === 'adjust_stock' || data.action === 'adjust') {
    if (!data.from_warehouse) throw new Error('warehouse required for adjust_stock (use from_warehouse)');
    updateMaterialStock(data.material_code, data.from_warehouse, qty);
    transactionsSh.appendRow([txnId, data.material_code, 'ADJUST', qty, data.from_warehouse, '', data.user_email, data.remarks || '', now]);
    updateStockStatus();
    return { success: true, txn_id: txnId };
  }

  if (data.action === 'transfer_stock_bulk') {
    const items = data.items || [];
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error('items[] is required for bulk transfer');
    }

    if (!data.from_warehouse || !data.to_warehouse) {
      throw new Error('from_warehouse and to_warehouse are required');
    }

    const toMs = data.to_ms || '';
    const preparedBy = data.prepared_by || data.user_email || '';
    const now = new Date();

    const transactionsSh = getSheet(SHEETS.TRANSACTIONS);

    // -------------------------------
    // 1️⃣ Pre-validation (NO writes)
    // -------------------------------
    items.forEach(item => {
      if (!item.material_code) {
        throw new Error('material_code missing in item');
      }
      const qty = Number(item.quantity);
      if (!qty || qty <= 0) {
        throw new Error('Invalid quantity for ' + item.material_code);
      }

      // Ensure stock exists
      const stockRow = findMaterialRow(item.material_code, data.from_warehouse);
      if (stockRow === -1) {
        throw new Error('Material not found in source warehouse: ' + item.material_code);
      }

      const colStock = headersMaterials.indexOf('current_stock') + 1;
      const currentStock = Number(materialsSh.getRange(stockRow, colStock).getValue()) || 0;
      if (qty > currentStock) {
        throw new Error(
          'Insufficient stock for ' + item.material_code +
          '. Available: ' + currentStock
        );
      }
    });

    // -------------------------------
    // 2️⃣ Begin atomic execution
    // -------------------------------
    const dcNo = getNextDcNo(true);

    const stockUndoLog = [];
    const txnRows = [];

    try {
      items.forEach(item => {
        const qty = Number(item.quantity);

        // Stock updates
        updateMaterialStock(item.material_code, data.from_warehouse, -qty);
        stockUndoLog.push({
          material_code: item.material_code,
          warehouse: data.from_warehouse,
          qty: qty
        });

        updateMaterialStock(
          item.material_code,
          data.to_warehouse,
          qty,
          item.extra
        );
        stockUndoLog.push({
          material_code: item.material_code,
          warehouse: data.to_warehouse,
          qty: -qty
        });

        const txnId = getNextTxnId();

        txnRows.push([
          txnId,                         // A txn_id
          item.material_code,            // B material_code
          'TRANSFER',                    // C type
          qty,                            // D quantity
          data.from_warehouse,           // E from_warehouse
          data.to_warehouse,             // F to_warehouse
          data.user_email,               // G user_email
          item.remarks || '',             // H remarks
          now,                            // I timestamp
          dcNo,                           // J dc_no
          toMs,                           // K to_ms
          preparedBy                     // L prepared_by
        ]);
      });

      // Append all rows at once
      transactionsSh
        .getRange(
          transactionsSh.getLastRow() + 1,
          1,
          txnRows.length,
          txnRows[0].length
        )
        .setValues(txnRows);

      updateStockStatus();

      return {
        success: true,
        dc_no: dcNo,
        txn_count: txnRows.length
      };

    } catch (err) {
      // -------------------------------
      // 3️⃣ Rollback everything
      // -------------------------------
      stockUndoLog.forEach(u => {
        updateMaterialStock(u.material_code, u.warehouse, u.qty);
      });

      throw new Error('Transfer rolled back: ' + err.message);
    }
  }

  if (data.action === 'transfer_stock') {
    if (!data.from_warehouse || !data.to_warehouse) throw new Error('Both from_warehouse and to_warehouse required for transfer');
    if (qty <= 0) throw new Error('Quantity must be > 0 for transfer');
    updateMaterialStock(data.material_code, data.from_warehouse, -qty);
    updateMaterialStock(data.material_code, data.to_warehouse, qty, data.extra);
    transactionsSh.appendRow([txnId, data.material_code, 'TRANSFER', qty, data.from_warehouse, data.to_warehouse, data.user_email, data.remarks || '', now]);
    updateStockStatus();
    return { success: true, txn_id: txnId };
  }


  throw new Error('Unknown action: ' + data.action);
}

/* ===== Web API entry point ===== */
function createSessionToken(email) {
  return Utilities.base64Encode(
    email + '|' + new Date().getTime() + '|' + Math.random()
  );
}

function loginUser(email, password) {
  const users = sheetToObjects(SHEETS.USERS);

  const user = users.find(
    u =>
      String(u.user_email).toLowerCase() === email.toLowerCase() &&
      String(u.active).toUpperCase() === 'TRUE'
  );

  if (!user) throw new Error('User not found or inactive');

  let user_password = 0;
  for (let i = 0; i < password.length; i++) {
    user_password += password.charCodeAt(i) * (i + 1); // i+1 because Excel is 1-based
  }

  if (!(user.password === user_password)) {
    throw new Error('Invalid password');
  }

  const token = createSessionToken(email);

  CacheService.getScriptCache().put(token, email, 24 * 60 * 60); // 1 day

  return {
    token,
    email: user.user_email,
    role: user.role
  };
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON)
}

/* ===== GET debug endpoint ===== */
function doGet(e) {
  try {
    ensureSheetsOrThrow();

    const op = e.parameter?.op;
    const token = e.parameter?.id_token;

    if (!e.parameter?.user_email || !token) {
      return jsonResponse({ success: false, error: 'auth_required' });
    }
    const email = CacheService.getScriptCache().get(token);
    if (!email) {
      return jsonResponse({ success: false, error: 'session_expired' });
    }
    if (!op) {
      return jsonResponse({ success: false, error: 'missing_op' });
    }

    const role = getUserRole(email);
    if (!role) throw new Error('Unauthorized user');

    if (op === 'get_me') {
      return jsonResponse({
        email: email,
        role: role
      });
    }

    if (op === 'warehouses') {
      return jsonResponse({
        success: true,
        data: sheetToObjects(SHEETS.WAREHOUSES)
      });
    }

    if (op === 'materials') {
      return jsonResponse({
        success: true,
        data: getMaterialsView()
      });
    }

    if (op === 'transactions') {
      if (role !== 'manager') {
        return jsonResponse({ success: false, error: 'forbidden' });
      }
      return jsonResponse({
        success: true,
        data: getTransactionHistory({
          material_code: e.parameter.material_code,
          warehouse_id: e.parameter.warehouse_id,
          type: e.parameter.type,
          from_date: e.parameter.from_date,
          to_date: e.parameter.to_date
        })
      });
    }

    if (op === 'low_stock') {
      const threshold = Number(e.parameter.threshold) || 0;
      return jsonResponse({
        success: true,
        data: getLowStockMaterials(threshold)
      });
    }

    if (op === 'dc_no') {
      return jsonResponse({
        success: true,
        dc_no: getNextDcNo()
      });
    }

    if (op === 'get_dc_by_no') {
      if (role !== 'manager') {
        return jsonResponse({ success: false, error: 'forbidden' });
      }
      const dcNo = e.parameter?.val;
      if (!dcNo) {
        return jsonResponse({ success: false, error: 'missing_DcNo' });
      }
      let result = get_dc_by_no(dcNo);
      return jsonResponse(result);
    }

    return jsonResponse({
      success: true,
      message: 'Inventory API ready'
    });

  } catch (err) {
    Logger.log('doGet error: ' + err);
    return jsonResponse({ success: false, error: err.message || String(err) });
  }
}

function doPost(e) {
  try {
    ensureSheetsOrThrow();

    const action = e.parameter.action;

    if (action === 'login') {
      return jsonResponse({
        success: true,
        data: loginUser(
          e.parameter.email,
          e.parameter.password
        )
      });
    }

    // Auth
    const token = e.parameter?.id_token;
    if (!token) {
      return jsonResponse({ success: false, error: 'auth_required' });
    }

    const email = CacheService.getScriptCache().get(token);
    if (!email) {
      return jsonResponse({ success: false, error: 'session_expired' });
    }
    const role = getUserRole(email);
    if (!role) throw new Error('Unauthorized user');

    // ✅ Parse JSON body
    const body = JSON.parse(e.postData.contents || '{}');
    const data = body.data;

    if (!data || !data.action) {
      throw new Error('Invalid data: missing action');
    }

    if (data.action === 'verify_dc') {
      if (role !== 'manager') {
        return jsonResponse({ success: false, error: 'forbidden' });
      }
      const dcNo = data.val;
      if (!dcNo) {
        return jsonResponse({ success: false, error: 'missing_DcNo' });
      }
      let result = verify_dc(dcNo);
      return jsonResponse(result);
    }

    const result = createTransaction({
      ...data,
      user_email: email
    });

    return jsonResponse({ success: true, result });

  } catch (err) {
    return jsonResponse({ success: false, error: err.message });
  }
}

function updateStockStatus() {
  const ss = SpreadsheetApp.getActive();
  const sheet = ss.getSheetByName("Materials");
  if (!sheet) throw new Error("Materials sheet not found");

  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return;

  const headers = data[0].map(h => h.toString().trim());

  const codeIdx = headers.indexOf("material_code");
  const stockIdx = headers.indexOf("current_stock");
  const statusIdx = headers.indexOf("stock_ok");
  const updatedIdx = headers.indexOf("updated_at");

  if (codeIdx === -1 || stockIdx === -1 || statusIdx === -1) {
    throw new Error("Required columns missing in Materials sheet");
  }

  const now = new Date();

  for (let i = 1; i < data.length; i++) {
    const materialCode = String(data[i][codeIdx]).trim();

    // If material_code is empty → clear dependent fields
    if (!materialCode) {
      sheet.getRange(i + 1, statusIdx + 1).clearContent();
      if (updatedIdx !== -1) {
        sheet.getRange(i + 1, updatedIdx + 1).clearContent();
      }
      continue;
    }

    const stock = Number(data[i][stockIdx]) || 0;
    const status = stock > 0 ? "OK" : "OUT_OF_STOCK";

    sheet.getRange(i + 1, statusIdx + 1).setValue(status);
    if (updatedIdx !== -1) {
      sheet.getRange(i + 1, updatedIdx + 1).setValue(now);
    }
  }
}

function getMaterialsView() {
  ensureSheetsOrThrow();
  updateStockStatus(); // ensure freshness

  const materials = sheetToObjects(SHEETS.MATERIALS);

  return materials
    .filter(m => m.material_code && m.warehouse_id)
    .map(m => ({
      material_code: m.material_code,
      material_name: m.material_name,
      unit: m.unit,
      warehouse_id: m.warehouse_id,
      current_stock: Number(m.current_stock) || 0,
      stock_ok: m.stock_ok,
      updated_at: m.updated_at,
      price: m.price
    }));
}

function getTransactionHistory(filters = {}) {
  ensureSheetsOrThrow();
  const txns = sheetToObjects(SHEETS.TRANSACTIONS);

  return txns.filter(t => {
    if (filters.material_code && t.material_code !== filters.material_code) return false;
    if (filters.type && t.type !== filters.type) return false;

    if (filters.warehouse_id) {
      if (t.from_warehouse !== filters.warehouse_id &&
        t.to_warehouse !== filters.warehouse_id) return false;
    }

    if (filters.from_date) {
      if (new Date(t.timestamp) < new Date(filters.from_date)) return false;
    }

    if (filters.to_date) {
      if (new Date(t.timestamp) > new Date(filters.to_date)) return false;
    }

    return true;
  });
}

function getLowStockMaterials(threshold = 0) {
  ensureSheetsOrThrow();
  updateStockStatus();

  const materials = sheetToObjects(SHEETS.MATERIALS);

  return materials.filter(m =>
    m.material_code &&
    Number(m.current_stock) <= threshold
  ).map(m => ({
    material_code: m.material_code,
    material_name: m.material_name,
    warehouse_id: m.warehouse_id,
    current_stock: Number(m.current_stock),
    unit: m.unit
  }));
}

function get_dc_by_no(dcNo) {
  ensureSheetsOrThrow();

  const transactions = sheetToObjects(SHEETS.TRANSACTIONS);

  const rows = transactions.filter(r => String(r.dc_no) === String(dcNo));

  if (rows.length === 0) {
    return { success: false, message: "DC not found", dcNo};
  }

  return {
    success: true,
    data: {
      dc_no: dcNo,
      toMs: rows[0].to_ms,
      preparedBy: rows[0].prepared_by,
      date: rows[0].timestamp,
      verifiedAt: rows[0].dc_verified_at || null,
      fromWh: rows[0].from_warehouse,
      toWh: rows[0].to_warehouse,
      rows: rows.map(r => ({
        txn_id: r.txn_id,
        material_code: r.material_code,
        quantity: r.quantity,
        remarks: r.remarks
      }))
    }
  };
}

function verify_dc(dcNo) {
  ensureSheetsOrThrow();

  const sh = SpreadsheetApp.getActive()
    .getSheetByName(SHEETS.TRANSACTIONS);

  const values = sh.getDataRange().getValues();
  const headers = values[0];

  const dcCol = headers.indexOf("dc_no");
  const verifiedCol = headers.indexOf("dc_verified_at");

  if (dcCol === -1 || verifiedCol === -1) {
    throw new Error("Required columns not found");
  }

  const now = new Date();
  let updatedCount = 0;
  let verifiedAt = 0;

  for (let i = 1; i < values.length; i++) {
    const row = values[i];

    if (String(row[dcCol]) === String(dcNo)) {
      if (row[verifiedCol]) {
        verifiedAt = row[verifiedCol]
      }
      if (!row[verifiedCol]) {
        sh.getRange(i + 1, verifiedCol + 1).setValue(now);
        verifiedAt = now
        updatedCount++;
      }
    }
  }

  return {
    success: updatedCount > 0,
    verified_at: verifiedAt,
    updated_rows: updatedCount
  };
}


function test_verify_dc() {
  const data = verify_dc(15);
  Logger.log(data);
}

function test_getDcNo() {
  const data = get_dc_by_no(10);
  Logger.log(data);
}

function test_getDcNoView() {
  const data = getNextDcNo();
  Logger.log(data.slice(0, 10));
}

function test_getMaterialsView() {
  const data = getMaterialsView();
  Logger.log(data.slice(0, 10));
}

function test_getTransactionHistory() {
  const data = getTransactionHistory({ warehouse_id: 'W1' });
  Logger.log(data.slice(0, 10));
}

function test_getLowStockMaterials() {
  const data = getLowStockMaterials(5);
  Logger.log(data);
}

function testSheetToObjects() {
  try {
    const arr = sheetToObjects("Materials");
    Logger.log("Materials count: " + arr.length);
    Logger.log(JSON.stringify(arr, null, 2));
  } catch (err) {
    Logger.log("ERROR: " + String(err));
    throw err;
  }
}

/* ===== Test helper ===== */
function testProcessTransaction() {
  // Make sure your Users/Warehouses/Materials/Settings exist before running this
  const input = {
    action: 'stock_in',
    data: {
      material_code: 'SS001',
      quantity: 20,
      to_warehouse: 'W1',
      user_email: 'manager@company.com',
      remarks: 'Test IN'
    }
  };
  Logger.log(JSON.stringify(createTransaction({ action: input.action, ...input.data })));
}
