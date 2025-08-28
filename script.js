document.getElementById('pdfForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    // Load the template PDF
    const existingPdfBytes = await fetch('assets/input.pdf').then(res => res.arrayBuffer());
    const pdfDoc = await PDFLib.PDFDocument.load(existingPdfBytes);

    // Use built-in fonts
    const timesFont = await pdfDoc.embedStandardFont(PDFLib.StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedStandardFont(PDFLib.StandardFonts.HelveticaBold);

    const page = pdfDoc.getPages()[0];
    const { width, height } = page.getSize();

    const fontSize = 8;
    const black = PDFLib.rgb(0, 0, 0);

    // Helper function for placing text
    const replaceText = (text, x, y, w, h, fontSizeOverride = fontSize, align = 'left', fontOverride = timesFont) => {
        const textWidth = fontOverride.widthOfTextAtSize(text, fontSizeOverride);
        const textHeight = fontSizeOverride;

        let textX = x + 2;
        if (align === 'center') textX = x + w / 2 - textWidth / 2;
        if (align === 'right') textX = x + w - textWidth - 2;

        const textY = y + (h - textHeight) / 2;

        page.drawText(text, {
            x: textX,
            y: textY,
            size: fontSizeOverride,
            font: boldFont,
            color: black,
        });
    };

    // Field mapping with IDs matching HTML
    const fieldMap = [
        { name: 'centerName', x: 220, y: 727, w: 100, h: 6 },
        { name: 'ghc', x: 45, y: 690, w: 40, h: 7 },
        { name: 'gcc', x: 120, y: 690, w: 150, h: 7 },
        { name: 'examDate', x: 240, y: 690, w: 50, h: 7 },
        { name: 'expiryDate', x: 340, y: 690, w: 50, h: 7 },
        { name: 'name', x: 104, y: 632, w: 150, h: 6 },
        { name: 'marital', x: 104, y: 612, w: 80, h: 6 },
        { name: 'passportNo', x: 177, y: 612, w: 80, h: 6 },
        { name: 'age', x: 250, y: 610, w: 50, h: 6 },
        { name: 'gender', x: 285, y: 633, w: 80, h: 6 },
        { name: 'passportExpiry', x: 285, y: 610, w: 100, h: 6 },
        { name: 'phone', x: 385, y: 610, w: 150, h: 6 },
        { name: 'height', x: 105, y: 591, w: 80, h: 6 },
        { name: 'weight', x: 178, y: 591, w: 80, h: 6 },
        { name: 'bmi', x: 250, y: 591, w: 80, h: 7 },
        { name: 'nationality', x: 385, y: 631, w: 80, h: 6 },
        { name: 'travelTo', x: 460, y: 631, w: 100, h: 6 },
        { name: 'profession', x: 460, y: 610, w: 100, h: 6 },
        { name: 'remarksName', x: 495, y: 176, w: 98, h: 4 },
    ];

    // Loop through fields and draw values
    fieldMap.forEach(field => {
        let value = document.getElementById(field.name)?.value || '';
        let fieldFont = timesFont;
        let fieldFontSize = fontSize;

        // Format dates as DD/MM/YYYY for PDF
        if (['examDate', 'expiryDate', 'passportExpiry'].includes(field.name) && value) {
            const d = new Date(value);
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const year = d.getFullYear();
            value = `${day}/${month}/${year}`;
        }

        if (field.name === 'name') value = value.toUpperCase();
        if (field.name === 'centerName') fieldFont = boldFont;
        if (field.name === 'remarksName') value = document.getElementById('name').value.toUpperCase();
        if (field.name === 'height' && value) value += ' cm';
        if (field.name === 'weight' && value) value += ' kg';

        if (['ghc', 'gcc', 'examDate', 'expiryDate'].includes(field.name)) {
            fieldFontSize = 9;
        }

        replaceText(value, field.x, field.y, field.w, field.h, fieldFontSize, 'left', fieldFont);
    });

    // Embed photo
    const photoFile = document.getElementById('photo').files[0];
    if (photoFile) {
        const photoBytes = await photoFile.arrayBuffer();
        let image;

        if (photoFile.type === 'image/jpeg') {
            image = await pdfDoc.embedJpg(photoBytes);
        } else if (photoFile.type === 'image/png') {
            image = await pdfDoc.embedPng(photoBytes);
        } else {
            alert('Unsupported image format. Please upload a JPG or PNG.');
            return;
        }

        page.drawImage(image, {
            x: 35,
            y: height - 180,
            width: 50,
            height: 50,
        });
    }

    // Save and trigger download
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${document.getElementById('name').value.toUpperCase()}_Fitcard.pdf`;
    link.click();
});

// --- Auto-fill expiry date based on exam date (+60 days) ---
const examDateInput = document.getElementById('examDate');
const expiryDateInput = document.getElementById('expiryDate');

examDateInput.addEventListener('change', () => {
    if (!examDateInput.value) return;

    // Parse exam date (YYYY-MM-DD) safely without timezone issues
    const [year, month, day] = examDateInput.value.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    d.setDate(d.getDate() + 60); // Add 60 days

    const newYear = d.getFullYear();
    const newMonth = String(d.getMonth() + 1).padStart(2, '0');
    const newDay = String(d.getDate()).padStart(2, '0');

    expiryDateInput.value = `${newYear}-${newMonth}-${newDay}`; // Sets correct value for date picker
});
