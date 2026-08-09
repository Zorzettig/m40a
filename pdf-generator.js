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

    // Calcolo un fattore di scala basato sull'altezza della pagina.
    // Il foglio A4 orizzontale standard è alto ~595 punti.
    const scale = height / 595;

    // Dimensioni font proporzionate
    const sizeLarge = 22 * scale; // Per Treno, date, ruoli, firme
    const sizeNormal = 18 * scale; // Per il testo libero

    // --- Inserimento Dati ---

    // N. M40a
    page.drawText(data.numeroM40, {
        x: width * 0.87,
        y: height * 0.81,
        size: sizeLarge,
        font: fontBold,
        color: textColor,
    });

    // Numero Treno
    page.drawText(data.numeroTreno, {
        x: width * 0.44,
        y: height * 0.68,
        size: sizeLarge,
        font: fontBold,
        color: textColor,
    });

    // Data (Giorno, Mese, Anno)
    page.drawText(day, { x: width * 0.65, y: height * 0.68, size: sizeLarge, font: fontBold });
    page.drawText(month, { x: width * 0.72, y: height * 0.68, size: sizeLarge, font: fontBold });
    page.drawText(shortYear, { x: width * 0.81, y: height * 0.68, size: sizeLarge, font: fontBold });

    // Ruolo
    page.drawText(data.ruolo, {
        x: width * 0.38,
        y: height * 0.61,
        size: sizeLarge,
        font: fontBold,
    });

    // Barramento "Si ordina" o "Si dà avviso"
    if (data.azione === 'avviso') {
        // Barra "Si ordina"
        page.drawLine({
            start: { x: width * 0.05, y: height * 0.62 },
            end: { x: width * 0.17, y: height * 0.62 },
            thickness: 2 * scale,
            color: textColor,
        });
    } else {
        // Barra "Si dà avviso"
        page.drawLine({
            start: { x: width * 0.18, y: height * 0.62 },
            end: { x: width * 0.32, y: height * 0.62 },
            thickness: 2 * scale,
            color: textColor,
        });
    }

    // Testo Prescrizione (8 righe puntinate)
    const startY = height * 0.543;
    const lineSpacing = height * 0.0385; // Spaziatura tra le righe
    const maxWidth = width * 0.88; 

    // Text wrapping
    const words = data.testo.split(' ');
    let lines = [];
    let currentLine = '';
    
    for (let i = 0; i < words.length; i++) {
        const testLine = currentLine + words[i] + ' ';
        // Usa sizeNormal per calcolare la larghezza corretta
        const textWidth = fontNormal.widthOfTextAtSize(testLine, sizeNormal);
        if (textWidth > maxWidth && i > 0) {
            lines.push(currentLine);
            currentLine = words[i] + ' ';
        } else {
            currentLine = testLine;
        }
    }
    if (currentLine.trim() !== '') {
        lines.push(currentLine);
    }

    // Stampa massimo 8 righe
    const maxLines = Math.min(lines.length, 8);
    for (let i = 0; i < maxLines; i++) {
        page.drawText(lines[i].trim(), {
            x: width * 0.05,
            y: startY - (i * lineSpacing),
            size: sizeNormal,
            font: fontNormal,
        });
    }

    // Emittente (Firma in basso a sinistra, sopra le note)
    const emittenteString = `${data.emittenteCognome} ${data.emittenteProgressivo} alle ore ${data.oraEmissione}`;
    page.drawText(emittenteString, {
        x: width * 0.05,
        y: height * 0.275,
        size: sizeLarge,
        font: fontBold,
    });

    // Agente di Condotta (Firma in basso a destra, sopra i puntini)
    page.drawText(`${data.adcCognome}   ${data.adcProgressivo}`, {
        x: width * 0.62,
        y: height * 0.185,
        size: sizeLarge,
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
