document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('m40a-form');
    const btnScarica = document.getElementById('btn-scarica');
    const btnSvuota = document.getElementById('btn-svuota');

    const btnVisualizza = document.getElementById('btn-visualizza');

    // Imposta data e ora correnti come default
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const time = now.toTimeString().split(' ')[0].substring(0, 5);
    
    document.getElementById('data-emissione').value = today;
    document.getElementById('ora-emissione').value = time;

    function getFormData() {
        if (!form.checkValidity()) {
            form.reportValidity();
            return null;
        }
        return {
            numeroM40: document.getElementById('numero-m40').value,
            numeroTreno: document.getElementById('numero-treno').value,
            dataEmissione: document.getElementById('data-emissione').value,
            azione: document.querySelector('input[name="azione"]:checked').value,
            ruolo: document.getElementById('ruolo').value,
            testo: document.getElementById('testo-prescrizione').value,
            emittenteCognome: document.getElementById('cognome-emittente').value,
            emittenteProgressivo: document.getElementById('progressivo-emittente').value,
            oraEmissione: document.getElementById('ora-emissione').value,
            adcCognome: document.getElementById('cognome-adc').value,
            adcProgressivo: document.getElementById('progressivo-adc').value,
        };
    }

    btnVisualizza.addEventListener('click', async () => {
        const data = getFormData();
        if (!data) return;
        
        try {
            const { pdfBytes } = await generatePDF(data);
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const blobUrl = URL.createObjectURL(blob);
            window.open(blobUrl, '_blank');
        } catch (error) {
            console.error("Errore durante la generazione del PDF:", error);
            alert("Si è verificato un errore durante la generazione del PDF.");
        }
    });

    btnScarica.addEventListener('click', async () => {
        const data = getFormData();
        if (!data) return;
        
        try {
            const { pdfBytes, fileName } = await generatePDF(data);
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const blobUrl = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
        } catch (error) {
            console.error("Errore durante la generazione del PDF:", error);
            alert("Si è verificato un errore durante la generazione del PDF.");
        }
    });

    btnSvuota.addEventListener('click', () => {
        if (confirm('Sei sicuro di voler svuotare tutti i campi?')) {
            form.reset();
            // Reimposta data e ora correnti
            const resetNow = new Date();
            document.getElementById('data-emissione').value = resetNow.toISOString().split('T')[0];
            document.getElementById('ora-emissione').value = resetNow.toTimeString().split(' ')[0].substring(0, 5);
        }
    });
});
