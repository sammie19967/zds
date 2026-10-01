export const getStudentDiscount = (student, courseFee) => {
  const fee = Math.max(0, Number(courseFee) || 0);
  const value = Math.max(0, Number(student?.discountValue) || 0);
  const type = student?.discountType;
  const amount = type === 'percentage'
    ? fee * Math.min(value, 100) / 100
    : type === 'fixed' ? value : 0;
  return Math.min(fee, amount);
};

export const getDiscountedCourseFee = (student, courseFee) =>
  Math.max(0, (Number(courseFee) || 0) - getStudentDiscount(student, courseFee));

export const formatStudentDiscount = (student) => {
  const value = Math.max(0, Number(student?.discountValue) || 0);
  if (!value) return 'No discount';
  if (student?.discountType === 'percentage') return `${Math.min(value, 100)}%`;
  if (student?.discountType === 'fixed') return `KSh ${value.toLocaleString()}`;
  return 'No discount';
};
