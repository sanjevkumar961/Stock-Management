export function DeliveryChallan({ data }) {
    return (
        <div className="dc-print-wrapper">
            <button className="no-print" onClick={() => window.print()}>
                Print DC
            </button>

            <div className="dc-page">
                <div className="dc-header">
                    <h2>DELIVERY CHALLAN</h2>
                    <p className="company-name">
                        <strong>HANDY THINK ENGINEERING UNIT - II</strong>
                    </p>
                    <p>(An ISO 9001-2015 Certified Company)</p>
                    <p>
                        2/8-20, SSV Dass Nagar, Neelambur, Coimbatore - 641062<br />
                        GSTIN: 33AXAPV0462C1ZW
                    </p>
                </div>
                <hr />
                <div className="dc-meta">
                    <div><strong>No:</strong> {data.dc_no}</div>
                    <div><strong>Date:</strong> {data.date.toLocaleDateString()}</div>
                </div>
                <p>
                    <strong>To M/s:</strong> {data.toMs}
                </p>
                <p>
                    <strong>Party's GSTIN:</strong>
                </p>
                <table className="dc-table">
                    <thead>
                        <tr>
                            <th>S.No</th>
                            <th>Description</th>
                            <th>Qty</th>
                            <th>Remarks</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.rows.map((r, i) => (
                            <tr key={i}>
                                <td>{i + 1}</td>
                                <td>{r.material_code}</td>
                                <td>{r.quantity}</td>
                                <td>{r.remarks}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="dc-footer-right">
                    For HANDY THINK ENGINEERING UNIT - II
                </div>
                <div className="sign">
                    <div>Receiver’s Signature & Seal</div>
                    <div>Prepared by<br />{data.preparedBy}</div>
                    <div>Authorised Signatory</div>
                </div>
            </div>
        </div>
    );
}
