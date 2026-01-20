import jsPDF from "jspdf";

interface ReceiptData {
  receiptNumber: string;
  studentName: string;
  studentEmail: string;
  courseName: string;
  courseFullName: string;
  centerName: string;
  paymentDate: string;
  amount: number;
  paymentMethod: string;
  totalFee: number;
  totalPaid: number;
  balanceDue: number;
  notes?: string;
}

export const generateReceiptPDF = (data: ReceiptData): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Colors
  const primaryColor: [number, number, number] = [37, 99, 235]; // Blue
  const accentColor: [number, number, number] = [16, 185, 129]; // Green
  const textColor: [number, number, number] = [31, 41, 55];
  const mutedColor: [number, number, number] = [107, 114, 128];
  
  // Header gradient background
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 50, "F");
  
  // Logo area
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(15, 10, 30, 30, 4, 4, "F");
  doc.setFontSize(20);
  doc.setTextColor(...primaryColor);
  doc.text("MCC", 20, 30);
  
  // Title
  doc.setFontSize(24);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.text("PAYMENT RECEIPT", 55, 25);
  
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("Modern Computer Centre", 55, 35);
  
  // Receipt number and date box
  doc.setFillColor(243, 244, 246);
  doc.roundedRect(pageWidth - 70, 55, 60, 30, 3, 3, "F");
  
  doc.setFontSize(9);
  doc.setTextColor(...mutedColor);
  doc.text("Receipt No:", pageWidth - 65, 65);
  doc.setFontSize(10);
  doc.setTextColor(...textColor);
  doc.setFont("helvetica", "bold");
  doc.text(data.receiptNumber || "N/A", pageWidth - 65, 73);
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...mutedColor);
  doc.text("Date:", pageWidth - 65, 80);
  doc.setFontSize(10);
  doc.setTextColor(...textColor);
  doc.text(data.paymentDate, pageWidth - 65, 88);
  
  // Student Information Section
  let yPos = 100;
  
  doc.setFillColor(249, 250, 251);
  doc.roundedRect(15, yPos - 5, pageWidth - 30, 45, 3, 3, "F");
  
  doc.setFontSize(12);
  doc.setTextColor(...primaryColor);
  doc.setFont("helvetica", "bold");
  doc.text("Student Information", 20, yPos + 5);
  
  doc.setFontSize(10);
  doc.setTextColor(...textColor);
  doc.setFont("helvetica", "normal");
  
  doc.text(`Name: ${data.studentName}`, 20, yPos + 18);
  doc.text(`Email: ${data.studentEmail}`, 20, yPos + 28);
  doc.text(`Center: ${data.centerName || "Not specified"}`, 20, yPos + 38);
  
  // Course Information Section
  yPos = 155;
  
  doc.setFillColor(249, 250, 251);
  doc.roundedRect(15, yPos - 5, pageWidth - 30, 35, 3, 3, "F");
  
  doc.setFontSize(12);
  doc.setTextColor(...primaryColor);
  doc.setFont("helvetica", "bold");
  doc.text("Course Details", 20, yPos + 5);
  
  doc.setFontSize(10);
  doc.setTextColor(...textColor);
  doc.setFont("helvetica", "normal");
  
  doc.text(`Course: ${data.courseName}`, 20, yPos + 18);
  doc.text(`Full Name: ${data.courseFullName}`, 20, yPos + 28);
  
  // Payment Details Section
  yPos = 200;
  
  doc.setFontSize(12);
  doc.setTextColor(...primaryColor);
  doc.setFont("helvetica", "bold");
  doc.text("Payment Details", 20, yPos);
  
  yPos += 10;
  
  // Table header
  doc.setFillColor(...primaryColor);
  doc.rect(15, yPos, pageWidth - 30, 10, "F");
  
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.text("Description", 20, yPos + 7);
  doc.text("Amount", pageWidth - 45, yPos + 7);
  
  yPos += 15;
  
  // Payment row
  doc.setFillColor(249, 250, 251);
  doc.rect(15, yPos - 3, pageWidth - 30, 15, "F");
  
  doc.setTextColor(...textColor);
  doc.setFont("helvetica", "normal");
  doc.text(`Payment (${data.paymentMethod})`, 20, yPos + 7);
  doc.setTextColor(...accentColor);
  doc.setFont("helvetica", "bold");
  doc.text(`₹${data.amount.toLocaleString()}`, pageWidth - 45, yPos + 7);
  
  // Summary Section
  yPos += 30;
  
  const summaryX = pageWidth - 90;
  
  doc.setFillColor(249, 250, 251);
  doc.roundedRect(summaryX - 10, yPos - 5, 90, 55, 3, 3, "F");
  
  doc.setFontSize(10);
  doc.setTextColor(...mutedColor);
  doc.setFont("helvetica", "normal");
  
  doc.text("Course Fee:", summaryX, yPos + 5);
  doc.setTextColor(...textColor);
  doc.text(`₹${data.totalFee.toLocaleString()}`, summaryX + 60, yPos + 5);
  
  doc.setTextColor(...mutedColor);
  doc.text("Total Paid:", summaryX, yPos + 18);
  doc.setTextColor(...accentColor);
  doc.text(`₹${data.totalPaid.toLocaleString()}`, summaryX + 60, yPos + 18);
  
  doc.setDrawColor(...primaryColor);
  doc.line(summaryX, yPos + 25, summaryX + 75, yPos + 25);
  
  doc.setFontSize(11);
  doc.setTextColor(...textColor);
  doc.setFont("helvetica", "bold");
  doc.text("Balance Due:", summaryX, yPos + 38);
  
  if (data.balanceDue > 0) {
    doc.setTextColor(220, 38, 38);
  } else {
    doc.setTextColor(...accentColor);
  }
  doc.text(`₹${data.balanceDue.toLocaleString()}`, summaryX + 60, yPos + 38);
  
  // Notes
  if (data.notes) {
    yPos += 65;
    doc.setFontSize(9);
    doc.setTextColor(...mutedColor);
    doc.setFont("helvetica", "italic");
    doc.text(`Notes: ${data.notes}`, 20, yPos);
  }
  
  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 30;
  
  doc.setDrawColor(229, 231, 235);
  doc.line(15, footerY - 10, pageWidth - 15, footerY - 10);
  
  doc.setFontSize(9);
  doc.setTextColor(...mutedColor);
  doc.setFont("helvetica", "normal");
  doc.text("Thank you for your payment!", pageWidth / 2, footerY, { align: "center" });
  doc.text("Modern Computer Centre - Hatisala & Satulia", pageWidth / 2, footerY + 8, { align: "center" });
  
  doc.setFontSize(8);
  doc.text(`Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, pageWidth / 2, footerY + 16, { align: "center" });
  
  // Save the PDF
  const fileName = `Receipt_${data.receiptNumber || data.paymentDate.replace(/\//g, '-')}.pdf`;
  doc.save(fileName);
};

export const generateAllPaymentsReceiptPDF = (
  studentName: string,
  studentEmail: string,
  courseName: string,
  courseFullName: string,
  centerName: string,
  totalFee: number,
  payments: Array<{
    amount: number;
    payment_date: string;
    payment_method: string;
    receipt_number: string | null;
    notes: string | null;
  }>
): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  const primaryColor: [number, number, number] = [37, 99, 235];
  const accentColor: [number, number, number] = [16, 185, 129];
  const textColor: [number, number, number] = [31, 41, 55];
  const mutedColor: [number, number, number] = [107, 114, 128];
  
  // Header
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 45, "F");
  
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(15, 8, 28, 28, 4, 4, "F");
  doc.setFontSize(18);
  doc.setTextColor(...primaryColor);
  doc.text("MCC", 19, 26);
  
  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.text("PAYMENT STATEMENT", 52, 22);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Modern Computer Centre", 52, 32);
  
  // Student Info
  let yPos = 60;
  
  doc.setFillColor(249, 250, 251);
  doc.roundedRect(15, yPos - 5, pageWidth - 30, 35, 3, 3, "F");
  
  doc.setFontSize(10);
  doc.setTextColor(...textColor);
  doc.setFont("helvetica", "bold");
  doc.text("Student:", 20, yPos + 5);
  doc.setFont("helvetica", "normal");
  doc.text(studentName, 55, yPos + 5);
  
  doc.setFont("helvetica", "bold");
  doc.text("Course:", 20, yPos + 15);
  doc.setFont("helvetica", "normal");
  doc.text(`${courseName} - ${courseFullName}`, 55, yPos + 15);
  
  doc.setFont("helvetica", "bold");
  doc.text("Center:", 20, yPos + 25);
  doc.setFont("helvetica", "normal");
  doc.text(centerName || "Not specified", 55, yPos + 25);
  
  // Payment Table
  yPos = 105;
  
  doc.setFontSize(12);
  doc.setTextColor(...primaryColor);
  doc.setFont("helvetica", "bold");
  doc.text("Payment History", 20, yPos);
  
  yPos += 10;
  
  // Table Header
  doc.setFillColor(...primaryColor);
  doc.rect(15, yPos, pageWidth - 30, 10, "F");
  
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text("Date", 20, yPos + 7);
  doc.text("Receipt #", 55, yPos + 7);
  doc.text("Method", 100, yPos + 7);
  doc.text("Amount", pageWidth - 40, yPos + 7);
  
  yPos += 12;
  
  let totalPaid = 0;
  
  payments.forEach((payment, index) => {
    const bgColor = index % 2 === 0 ? [249, 250, 251] : [255, 255, 255];
    doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
    doc.rect(15, yPos - 3, pageWidth - 30, 12, "F");
    
    doc.setTextColor(...textColor);
    doc.setFont("helvetica", "normal");
    doc.text(new Date(payment.payment_date).toLocaleDateString(), 20, yPos + 5);
    doc.text(payment.receipt_number || "-", 55, yPos + 5);
    doc.text(payment.payment_method, 100, yPos + 5);
    
    doc.setTextColor(...accentColor);
    doc.setFont("helvetica", "bold");
    doc.text(`₹${payment.amount.toLocaleString()}`, pageWidth - 40, yPos + 5);
    
    totalPaid += payment.amount;
    yPos += 12;
  });
  
  // Summary
  yPos += 10;
  const balanceDue = totalFee - totalPaid;
  
  doc.setFillColor(249, 250, 251);
  doc.roundedRect(pageWidth - 100, yPos - 5, 90, 50, 3, 3, "F");
  
  doc.setFontSize(10);
  doc.setTextColor(...mutedColor);
  doc.setFont("helvetica", "normal");
  
  doc.text("Course Fee:", pageWidth - 95, yPos + 8);
  doc.setTextColor(...textColor);
  doc.text(`₹${totalFee.toLocaleString()}`, pageWidth - 35, yPos + 8);
  
  doc.setTextColor(...mutedColor);
  doc.text("Total Paid:", pageWidth - 95, yPos + 20);
  doc.setTextColor(...accentColor);
  doc.text(`₹${totalPaid.toLocaleString()}`, pageWidth - 35, yPos + 20);
  
  doc.setDrawColor(...primaryColor);
  doc.line(pageWidth - 95, yPos + 27, pageWidth - 15, yPos + 27);
  
  doc.setFontSize(11);
  doc.setTextColor(...textColor);
  doc.setFont("helvetica", "bold");
  doc.text("Balance:", pageWidth - 95, yPos + 40);
  
  if (balanceDue > 0) {
    doc.setTextColor(220, 38, 38);
  } else {
    doc.setTextColor(...accentColor);
  }
  doc.text(`₹${balanceDue.toLocaleString()}`, pageWidth - 35, yPos + 40);
  
  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 25;
  
  doc.setDrawColor(229, 231, 235);
  doc.line(15, footerY - 10, pageWidth - 15, footerY - 10);
  
  doc.setFontSize(8);
  doc.setTextColor(...mutedColor);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, pageWidth / 2, footerY, { align: "center" });
  doc.text("Modern Computer Centre - Hatisala & Satulia", pageWidth / 2, footerY + 8, { align: "center" });
  
  doc.save(`Payment_Statement_${studentName.replace(/\s+/g, '_')}_${courseName}.pdf`);
};
