import { jsPDF } from 'jspdf';

export const generateCertificate = (userName, courseTitle, completionDate) => {
    // Create a new PDF document (landscape orientation, physical size A4)
    const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
    });

    // Dimensions
    const width = doc.internal.pageSize.getWidth();
    const height = doc.internal.pageSize.getHeight();

    // Outer Border (Indigo)
    doc.setDrawColor(79, 70, 229); // Indigo 600
    doc.setLineWidth(5);
    doc.rect(10, 10, width - 20, height - 20);

    // Inner Border
    doc.setDrawColor(226, 232, 240); // Slate 200
    doc.setLineWidth(1);
    doc.rect(15, 15, width - 30, height - 30);

    // Title / Header
    doc.setTextColor(79, 70, 229); // Indigo 600
    doc.setFont("helvetica", "bold");
    doc.setFontSize(36);
    doc.text("CERTIFICATE OF COMPLETION", width / 2, 45, { align: "center" });

    // Subtitle
    doc.setTextColor(100, 116, 139); // Slate 500
    doc.setFont("helvetica", "normal");
    doc.setFontSize(16);
    doc.text("This is to certify that", width / 2, 65, { align: "center" });

    // User Name
    doc.setTextColor(15, 23, 42); // Slate 900
    doc.setFont("times", "bolditalic");
    doc.setFontSize(40);
    doc.text(userName || "Student", width / 2, 85, { align: "center" });

    // Divider Line
    doc.setDrawColor(203, 213, 225); // Slate 300
    doc.setLineWidth(0.5);
    doc.line(width / 2 - 60, 95, width / 2 + 60, 95);

    // Context text
    doc.setTextColor(100, 116, 139); // Slate 500
    doc.setFont("helvetica", "normal");
    doc.setFontSize(16);
    doc.text("has successfully completed the course", width / 2, 115, { align: "center" });

    // Course Title
    doc.setTextColor(79, 70, 229); // Indigo 600
    doc.setFont("helvetica", "bold");
    doc.setFontSize(26);
    const splitTitle = doc.splitTextToSize(courseTitle, width - 60);
    doc.text(splitTitle, width / 2, 135, { align: "center" });

    // Date
    const dateObj = new Date(completionDate || Date.now());
    const formattedDate = dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    doc.setTextColor(100, 116, 139); // Slate 500
    doc.setFont("helvetica", "normal");
    doc.setFontSize(14);
    doc.text(`Completed on: ${formattedDate}`, width / 2, 175, { align: "center" });

    // Signature Area
    doc.setDrawColor(15, 23, 42); // Slate 900
    doc.setLineWidth(0.5);
    doc.line(width / 2 - 40, 192, width / 2 + 40, 192);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(14);
    doc.text("E-Learning Platform", width / 2, 198, { align: "center" });

    // Generate filename safely
    const safeName = (userName || "Student").replace(/[^a-z0-9]/gi, '_').toLowerCase();

    // Save the PDF
    doc.save(`${safeName}_certificate.pdf`);
};
