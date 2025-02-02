import React from 'react';
import '../styles/PaymentInfo.css';  // Make sure your styles are applied here

const PaymentInfo = () => {
    return (
        <div className="payment-info-container">
            <div className="card">
                <h3>Payment Methods</h3>
                <ul>
                    <li>Mpesa Till number: <strong>9886487</strong></li>
                    <li>Pay through KCB account: <strong>1020154578</strong></li>
                    <li><strong>NB:</strong> Present Your Message At the office</li>
                    <li>Cash payment is not allowed</li>
                </ul>
            </div>

            <div className="card">
                <h3>Payment Terms</h3>
                <ul>
                    <li>Pay full amount once</li>
                    <li>Payment in 3 installments of 5k each</li>
                    <li>Ensure full payment before test booking</li>
                </ul>
            </div>

            <div className="card">
                <h3>NTSA and Other Charges</h3>
                <ul>
                    <li>Test booking: Ksh. <strong>750</strong></li>
                    <li>PDL*: Ksh. <strong>650</strong></li>
                    <li>Interim: Ksh. <strong>1050</strong></li>
                    <li>Smart DL: Ksh. <strong>3050</strong></li>
                    <li>Comprehensive Insurance</li>
                </ul>
            </div>

            <div className="card">
                <h3>Requirements</h3>
                <ul>
                    <li><strong>New Drivers:</strong> ID/Alien card</li>
                    <li><strong>Refresher:</strong> ID and/or DL</li>
                    <li><strong>Endorsement:</strong> DL</li>
                    <li>At least 5k to start learning</li>
                </ul>
            </div>
        </div>
    );
};

export default PaymentInfo;
