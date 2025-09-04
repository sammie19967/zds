import '../styles/FeesStructure.css';
import InfoCard from '../components/InfoCard';
import Table from '../components/Table';
import { PDFDocument, rgb } from 'pdf-lib';

const generatePDF = async () => {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 700]);

    const { height } = page.getSize();
    let yPosition = height - 50;

    // Title
    page.drawText("Fees Structure", { x: 50, y: yPosition, size: 18, color: rgb(0, 0, 0) });
    yPosition -= 30;

    // Table Headers
    const headers = ["Type", "Class", "Duration", "Fees", "Description"];
    let xPosition = 50;
    
    headers.forEach(header => {
        page.drawText(header, { x: xPosition, y: yPosition, size: 12, color: rgb(0, 0, 0) });
        xPosition += 100;
    });

    yPosition -= 20;

    const feesData = [
        { type: "New Student", class: "(A1/A2)", duration: "4 weeks", fees: "15,000", description: "Motorbike/Tuktuk" },
        { type: "Endorsement", class: "A1,A2", duration: "", fees: "5,000" },
        { type: "New Student", class: "B1,B2", duration: "4 weeks", fees: "15,000", description: "Saloon Car" },
        { type: "Endorsement", class: "B1,B2", duration: "", fees: "9,000" },
        { type: "Refresher", class: "B1,B2", duration: "3 weeks", fees: "9,050" },
        { type: "Endorsement", class: "C1,C2", duration: "", fees: "9,000", description: "Trucks" },
        { type: "Endorsement", class: "D1,D2", duration: "", fees: "9000", description: "PSV" },
        { type: "Computer", class: "", duration: "2 months", fees: "2000", description: "All Packages" },
        { type: "Boarding", class: "B/A", duration: "4 weeks", fees: "21,000", description: "Accommodation" }
    ];

    // Table Rows
    feesData.forEach(item => {
        xPosition = 50;
        const rowData = [item.type, item.class, item.duration, item.fees, item.description || ""];

        rowData.forEach(text => {
            page.drawText(text, { x: xPosition, y: yPosition, size: 10, color: rgb(0, 0, 0) });
            xPosition += 100;
        });

        yPosition -= 20;
    });

    const pdfBytes = await pdfDoc.save();
    
    // Native Download (No file-saver)
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fees-structure.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
};

const FeesStructure = () => {
    return (
        <div>
            <button onClick={generatePDF} style={{ margin: "10px", padding: "10px", background: "#007bff", color: "#fff", border: "none", cursor: "pointer" }}>
                Download Fees Structure
            </button>
        </div>
    );
};

export default FeesStructure;
