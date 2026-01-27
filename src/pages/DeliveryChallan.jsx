export function DeliveryChallan({ data }) {
    if (!data) return null;

    const rows = data.rows || [];

    const subtotal = rows.reduce((sum, r) => {
        const qty = Number(r.quantity) || 0;
        const price = Number(r.price) || 0;
        return sum + qty * price;
    }, 0);

    const cgst = subtotal * 0.09;
    const sgst = subtotal * 0.09;
    const grandTotal = subtotal + cgst + sgst;

    const format = v => v.toFixed(2);

    return (
        <div className="dc-print-wrapper">
            <button className="no-print dc-print-button" onClick={() => window.print()}>
                🖨️ Print Delivery Challan
            </button>

            <div className="dc-page">
                {data.verifiedAt && (
                    <div className="dc-watermark">
                        VERIFIED
                    </div>
                )}
                {data.verifiedAt && (
                    <div className="dc-verified-stamp">
                        ✓ VERIFIED
                        <br />
                        <small>{new Date(data.verifiedAt).toLocaleDateString()}</small>
                    </div>
                )}

                {/* Header */}
                <div className="dc-header">
                    <h2 className="dc-title">DELIVERY CHALLAN</h2>
                    <p className="company-name">
                        <strong>HANDY THINK ENGINEERING UNIT - II</strong>
                    </p>
                    <p className="company-subtitle">(An ISO 9001-2015 Certified Company)</p>
                    <p className="company-address">
                        2/8-20, SSV Dass Nagar, Neelambur, Coimbatore - 641062<br />
                        GSTIN: 33AXAPV0462C1ZW
                    </p>
                </div>

                {/* Meta */}
                <div className="dc-meta">
                    <div className="dc-meta-item">
                        <span className="dc-label">DC No:</span>
                        <span className="dc-value">{data.dc_no}</span>
                    </div>
                    <div className="dc-meta-item">
                        <span className="dc-label">Date:</span>
                        <span className="dc-value">{new Date(data.date).toLocaleDateString()}</span>
                    </div>
                </div>

                <div className="dc-party-info">
                    <div className="dc-info-row">
                        <span className="dc-label">To M/s:</span>
                        <span className="dc-value">{data.toMs || '________________'}</span>
                    </div>
                    <div className="dc-info-row">
                        <span className="dc-label">Party's GSTIN:</span>
                        <span className="dc-value">________________________</span>
                    </div>
                </div>

                {/* Table */}
                <table className="dc-table">
                    <thead>
                        <tr>
                            <th>S.No</th>
                            <th>Description</th>
                            <th>Qty</th>
                            <th>Rate (₹)</th>
                            <th>Amount (₹)</th>
                            <th>Remarks</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.length === 0 && (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center' }}>
                                    No items
                                </td>
                            </tr>
                        )}

                        {rows.map((r, i) => {
                            const qty = Number(r.quantity) || 0;
                            const price = Number(r.price) || 0;
                            const amount = qty * price;

                            return (
                                <tr key={i}>
                                    <td style={{ textAlign: 'center', width: '50px' }}>{i + 1}</td>
                                    <td style={{ textAlign: 'left' }}>{r.material_code}</td>
                                    <td style={{ textAlign: 'center', width: '80px' }}>{qty}</td>
                                    <td style={{ textAlign: 'right', width: '100px' }}>{format(price)}</td>
                                    <td style={{ textAlign: 'right', width: '100px' }}>{format(amount)}</td>
                                    <td style={{ textAlign: 'left', fontSize: '12px', color: '#555' }}>{r.remarks || '-'}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {/* Totals */}
                <div className="dc-totals">
                    <table>
                        <tbody>
                            <tr>
                                <td>Subtotal</td>
                                <td>₹ {format(subtotal)}</td>
                            </tr>
                            <tr>
                                <td>CGST @ 9%</td>
                                <td>₹ {format(cgst)}</td>
                            </tr>
                            <tr>
                                <td>SGST @ 9%</td>
                                <td>₹ {format(sgst)}</td>
                            </tr>
                            <tr className="grand-total">
                                <td><strong>Grand Total</strong></td>
                                <td><strong>₹ {format(grandTotal)}</strong></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                {/* Footer */}
                <div className="dc-footer">
                    <div className="receiver-sign">
                        <div style={{ height: '40px' }}></div>
                        Receiver's Signature & Seal
                    </div>

                    <div className="company-sign">
                        <div style={{ height: '40px' }}></div>
                        For HANDY THINK ENGINEERING UNIT - II<br/>
                        <strong>Authorised Signatory</strong>
                    </div>
                </div>
            </div>
        </div>
    );
}
