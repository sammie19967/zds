import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getPaymentByStudent } from '../utils/firebase';

const currency = (n) => `KSh ${Number(n || 0).toLocaleString()}`;

export default function VerifyReceipt() {
  const { studentId, paymentId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [payment, setPayment] = useState(null);
  const [student, setStudent] = useState(null);
  // No additional data needed for simple verification

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const data = await getPaymentByStudent(studentId, paymentId);
        if (!data) throw new Error('Receipt not found');
        const { payment, student } = data;
        if (mounted) { setPayment(payment); setStudent(student); }
        // No extra data needed here
      } catch (e) {
        setError(e?.message || 'Failed to verify receipt');
      } finally {
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [studentId, paymentId]);

  // Base fee computation is not required for simple verification view; omitted for performance.

  if (loading) return <div style={{ padding: 24 }}>Verifying receipt...</div>;
  if (error) return <div style={{ padding: 24, color: '#b91c1c' }}>{error}</div>;
  if (!payment || !student) return <div style={{ padding: 24 }}>Receipt not found</div>;

  const amount = Number(payment.amount) || 0;
  // Note: This page verifies existence and shows key info; computing previous totals across history is out of scope here.

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Receipt Verification</h1>
      <div style={{ color: '#475569', marginBottom: 16 }}>Zane Driving School</div>
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <div style={{ color: '#64748b', fontSize: 12 }}>Receipt No.</div>
            <div style={{ fontWeight: 700 }}>{String(payment.id).toLowerCase()}</div>
          </div>
          <div>
            <div style={{ color: '#64748b', fontSize: 12 }}>Date</div>
            <div style={{ fontWeight: 600 }}>{payment.paidAt ? new Date(payment.paidAt).toLocaleString() : (payment.createdAt?.seconds ? new Date(payment.createdAt.seconds * 1000).toLocaleString() : '')}</div>
          </div>
          <div>
            <div style={{ color: '#64748b', fontSize: 12 }}>Student</div>
            <div style={{ fontWeight: 800, color: '#1d4ed8' }}>{`${student.firstName || ''} ${student.lastName || ''}`.trim().toUpperCase()}</div>
          </div>
          <div>
            <div style={{ color: '#64748b', fontSize: 12 }}>Admission No.</div>
            <div style={{ fontWeight: 600 }}>{student.admissionNumber || '-'}</div>
          </div>
          <div>
            <div style={{ color: '#64748b', fontSize: 12 }}>Course</div>
            <div style={{ fontWeight: 600 }}>{student.course || '-'}</div>
          </div>
          <div>
            <div style={{ color: '#64748b', fontSize: 12 }}>Amount</div>
            <div style={{ fontWeight: 700, color: '#16a34a' }}>{currency(amount)}</div>
          </div>
          <div>
            <div style={{ color: '#64748b', fontSize: 12 }}>Method</div>
            <div style={{ fontWeight: 600 }}>{(payment.method || '-').toString().toUpperCase()}</div>
          </div>
          <div>
            <div style={{ color: '#64748b', fontSize: 12 }}>Confirmation Code</div>
            <div style={{ fontWeight: 600 }}>{payment.confirmationCode || '-'}</div>
          </div>
        </div>
        <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid #e2e8f0', color: '#64748b' }}>
          <div style={{ fontSize: 12 }}>Reference: This page confirms that the receipt exists in our records.</div>
        </div>
      </div>
    </div>
  );
}
