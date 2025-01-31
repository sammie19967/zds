import '../styles/FeesStructure.css';
import InfoCard from '../components/InfoCard';
import Table from '../components/Table';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';


const generatePDF = () => {
    const doc = new jsPDF();
    const tableData = feesData.map(item => [
        item.type, item.class, item.duration, item.fees, item.description || ""
    ]);

    doc.autoTable({
        head: [['Type', 'Class', 'Duration', 'Fees', 'Description']],
        body: tableData,
    });

    doc.save('fees-structure.pdf');
};

const FeesStructure = () => {
    const feesData = [
         { type: "New Student", class: "(A1/A2)", duration: "4 weeks", fees: "15,000", description: "Motorbike/Tuktuk"},
        { type: "Endorsement", class: "A1,A2", duration: "", fees: "5,000" },
        { type: "New Student", class: "B1,B2", duration: "4 weeks", fees: "15,000", description: "Saloon Car"},
        { type: "Endorsement", class: "B1,B2", duration: "", fees: "9,000" },
        { type: "Refresher", class: "B1,B2", duration: "3 weeks", fees: "9,050" },
        { type: "Endorsement", class: "C1,C2", duration: "", fees: "9,000" , description: "Trucks"},
        { type: "Endorsement", class: "D1,D2", duration: "" , description: "PSV", fees: "9000"},
        { type: "Computer", class: "" , duration: "2 months" , description: "All Packages" , fees: "2000"},
        { type: "Boarding", class: "B/A" , duration: "4 weeks" , description: "Accomodation" , fees: "21,000"}
        
      ];

      const pdfUrl = '/feesstructure.pdf'; 
  
  return (
    
    <div>
        
        <div className="cards-container">
        <InfoCard 
          title="Requirements" 
          backgroundColor="#ff5733" 
          content={(
            <ul className="dot-list">
              <li> National ID Card</li>
              <li> Passport/Alien ID</li>
              <li> 2 Photos</li>
              <li> Email Address</li>
              <li> Phone Number</li>
              <li> Driver's License (Endorsement and Refresher)</li>
              
            </ul>
          )}
        />

        <InfoCard
          title="Fees Payment" 
          backgroundColor="#33a2ff" 
          content={(
            <>
              <p>You can pay full amount via M-Pesa or Bank Account:</p>
              <ul className="dot-list">
                <li>M-Pesa Till 9886487</li>
                <li>KCB Bank  001521414555</li>
              </ul>
              <p><strong>Note:</strong> Cash is not allowed.</p> 
              <p>Payments in 3 weekly installments accepted .</p>
            </>
          )}
        />

        <InfoCard 
          title="Fees Overview" 
          backgroundColor="#28a745" 
          content={(
            <ul className="dot-list">
              <li>New Drivers: 15,000</li>
              <li>Endorsement: 9000</li>
              <li>Refresher: 9000</li>
              <li>No Hidden Charges</li>
            </ul>
          )}
        />

<InfoCard 
          title="Computer Training" 
          backgroundColor="#82z500" 
          content={(
            <ul className="dot-list">
              <li>All Computer Packages offered </li>
              <li>@ Ksh. 3000 only</li>
              <li>Practical approach </li>
              <li>Certification after completion</li>
            </ul>
          )}
        />
      </div>
      <Table data={feesData} pdfUrl={pdfUrl} />
    </div>
        )
    }

export default FeesStructure;
