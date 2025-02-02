import React from 'react';
import '../styles/FeesStructure.css';
import logo from '../assets/logo.png'; // Import logo
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import PaymentInfo from '../components/PaymentInfo'

const FeesStructure = () => {
    // Get current month and year dynamically
    const currentDate = new Date();
    const month = currentDate.toLocaleString('default', { month: 'long' });
    const year = currentDate.getFullYear();

    // Data for the table
    const tableData = [
        ["New Student", "(A1/A2)", "4 weeks", "15,000", "Motorbike/Tuktuk"],
        ["Endorsement", "A1, A2", "-", "5,000", ""],
        ["New Student", "B1, B2", "4 weeks", "15,000", "Saloon Car"],
        ["Endorsement", "B1, B2", "-", "9,000", ""],
        ["Refresher", "B1, B2", "3 weeks", "9,050", ""],
        ["Endorsement", "C1, C2", "-", "9,000", "Trucks"],
        ["Endorsement", "D1, D2", "-", "9,000", "PSV"],
        ["Computer", "-", "2 months", "2,000", "All Packages"],
        ["Boarding", "B/A", "4 weeks", "21,000", "Accommodation"]
    ];

    // Function to generate the PDF
    const generatePDF = () => {
        const doc = new jsPDF();

        // Add a page border
        doc.rect(5, 5, 200, 287); // (x, y, width, height)

        // Add Logo (Properly Scaled)
        const img = new Image();
        img.src = logo;
        img.onload = () => {
            const imgWidth = 40; // Set width
            const imgHeight = (img.height / img.width) * imgWidth; // Maintain aspect ratio

            doc.addImage(img, 'PNG', (doc.internal.pageSize.width - imgWidth) / 2, 10, imgWidth, imgHeight);

            // Add Title and Date (Centered)
            doc.setFontSize(18);
            doc.text("Fees Overview", doc.internal.pageSize.width / 2, 65, { align: "center" });
            doc.setFontSize(14);
            doc.text(`${month}, ${year}`, doc.internal.pageSize.width / 2, 75, { align: "center" });

            // Add Table (Properly Aligned)
            doc.autoTable({
                startY: 80,
                head: [["Type", "Class", "Duration", "Fees", "Description"]],
                body: tableData,
                styles: { halign: 'left', valign: 'middle', fontSize: 10 },
                headStyles: { fillColor: [0, 123, 255] }, // Blue header
                columnStyles: {
                    0: { cellWidth: 40 },
                    1: { cellWidth: 30 },
                    2: { cellWidth: 30 },
                    3: { cellWidth: 30 },
                    4: { cellWidth: 50 }
                }
            });

            // Save the PDF
            doc.save(`Fees_Structure_${month}_${year}.pdf`);
        };
    };

    return (
        
        <div className="fees-structure-container">
            <PaymentInfo/>
            {/* Logo */}
            <div className="fees-logo">
                <img src={logo} alt="Zane Driving School Logo" />
            </div>

            {/* Fees Overview */}
            <h2 className="fees-overview">Fees Overview</h2>
            <p className="fees-date">{month}, {year}</p>

            {/* Fees Table */}
            <table className="fees-table">
                <thead>
                    <tr>
                        <th>Type</th>
                        <th>Class</th>
                        <th>Duration</th>
                        <th>Fees</th>
                        <th>Description</th>
                    </tr>
                </thead>
                <tbody>
                    {tableData.map((row, index) => (
                        <tr key={index}>
                            {row.map((cell, cellIndex) => (
                                <td key={cellIndex}>{cell}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Download Button */}
            <button className="download-btn" onClick={generatePDF}>
                Download Fees Structure
            </button>
        </div>
    );
};

export default FeesStructure;
