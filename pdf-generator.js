async function generatePDF(data) {
    const { PDFDocument, StandardFonts, rgb } = PDFLib;

    // Fetch the template PDF
    const existingPdfBytes = await fetch('m40a%20pulito.pdf').then(res => res.arrayBuffer());

    // Load a PDFDocument from the existing PDF bytes
    const pdfDoc = await PDFDocument.load(existingPdfBytes);

    // Embed fonts
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontNormal = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Get the first page of the document
    const pages = pdfDoc.getPages();
    const page = pages[0];

    // Get the width and height of the page
    const { width, height } = page.getSize();
    // Origin (0,0) is bottom-left in pdf-lib!

    // Funzione per formattare la data (da YYYY-MM-DD a DD, MM, YY)
    const dataParts = data.dataEmissione.split('-');
    const year = dataParts[0];
    const shortYear = year.substring(2);
    const month = dataParts[1];
    const day = dataParts[2];

    const textColor = rgb(0, 0, 0);

    // Coordinates need to be fine-tuned. Let's make a good estimation.
    // Assuming standard landscape (e.g. 842 x 595) or similar.
    // We will place items relative to width/height to be safe.

    // N. M40a
    page.drawText(data.numeroM40, {
        x: width * 0.85,
        y: height * 0.77,
        size: 16,
        font: fontBold,
        color: textColor,
    });

    // Numero Treno
    page.drawText(data.numeroTreno, {
        x: width * 0.53,
        y: height * 0.65,
        size: 16,
        font: fontBold,
        color: textColor,
    });

    // Data (Giorno, Mese, Anno)
    page.drawText(day, { x: width * 0.71, y: height * 0.65, size: 16, font: fontBold });
    page.drawText(month, { x: width * 0.78, y: height * 0.65, size: 16, font: fontBold });
    page.drawText(shortYear, { x: width * 0.865, y: height * 0.65, size: 16, font: fontBold });

    // Ruolo
    page.drawText(data.ruolo, {
        x: width * 0.40,
        y: height * 0.58,
        size: 14,
        font: fontBold,
    });

    // Barramento "Si ordina" o "Si dà avviso"
    // Since coordinates might vary slightly, we draw a thick line over the option to cancel.
    if (data.azione === 'avviso') {
        // Barra "Si ordina"
        page.drawLine({
            start: { x: width * 0.05, y: height * 0.585 },
            end: { x: width * 0.17, y: height * 0.585 },
            thickness: 1.5,
            color: textColor,
        });
    } else {
        // Barra "Si dà avviso"
        page.drawLine({
            start: { x: width * 0.18, y: height * 0.585 },
            end: { x: width * 0.32, y: height * 0.585 },
            thickness: 1.5,
            color: textColor,
        });
    }

    // Testo Prescrizione (8 righe puntinate)
    const startY = height * 0.525;
    const lineSpacing = height * 0.038;
    const maxWidth = width * 0.90; // La larghezza totale della riga

    // Per il text wrapping, creiamo noi le righe splittando le parole
    const words = data.testo.split(' ');
    let lines = [];
    let currentLine = '';
    
    for (let i = 0; i < words.length; i++) {
        const testLine = currentLine + words[i] + ' ';
        const textWidth = fontNormal.widthOfTextAtSize(testLine, 12);
        if (textWidth > maxWidth && i > 0) {
            lines.push(currentLine);
            currentLine = words[i] + ' ';
        } else {
            currentLine = testLine;
        }
    }
    lines.push(currentLine);

    // Stampa massimo 8 righe
    const maxLines = Math.min(lines.length, 8);
    for (let i = 0; i < maxLines; i++) {
        // y va a decrescere (dall'alto verso il basso)
        page.drawText(lines[i].trim(), {
            x: width * 0.05,
            y: startY - (i * lineSpacing),
            size: 12,
            font: fontNormal,
        });
    }

    // Emittente (In basso a sinistra)
    const emittenteString = `${data.emittenteCognome} ${data.emittenteProgressivo} alle ore ${data.oraEmissione}`;
    page.drawText(emittenteString, {
        x: width * 0.05,
        y: height * 0.20,
        size: 14,
        font: fontBold,
    });

    // Agente di Condotta (In basso a destra)
    page.drawText(`${data.adcCognome}   ${data.adcProgressivo}`, {
        x: width * 0.60,
        y: height * 0.14,
        size: 14,
        font: fontBold,
    });

    // Serialize the PDFDocument to bytes (a Uint8Array)
    const pdfBytes = await pdfDoc.save();

    // Trigger the browser to download the PDF document
    const ore = data.oraEmissione.split(':')[0];
    const minuti = data.oraEmissione.split(':')[1];
    const fileName = `M40a del ${data.dataEmissione} alle ${ore} H ${minuti} m.pdf`;
    
    return { pdfBytes, fileName };
}
