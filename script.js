document.addEventListener('DOMContentLoaded', () => {
    // Referenties naar DOM-elementen
    const fileInput = document.getElementById('fileInput');
    const imagePreview = document.getElementById('imagePreview');
    const uploadButton = document.getElementById('uploadButton');
    const shutterButtonText = document.getElementById('shutterButtonText'); // Om de tekst in de knop te wijzigen
    const errorMessage = document.getElementById('errorMessage');
    const resultBox = document.getElementById('resultBox');
    const spanSoort = document.getElementById('spanSoort');
    const spanExoot = document.getElementById('spanExoot');
    const spanZekerheid = document.getElementById('spanZekerheid');
    const spanLocatie = document.getElementById('spanLocatie');
    const resetButton = document.getElementById('resetButton'); // De 'Done' knop
    const photosButton = document.getElementById('photosButton'); // De 'Fotos' knop
    const initialInstruction = document.getElementById('initialInstruction'); // De instructietekst

    // De URL van je n8n productie-webhook
    const N8N_WEBHOOK_URL = 'https://n8n.smarttenders.eu/webhook/665be6bd-b718-4569-8f5c-adb2b9dc2ec7'; // **VERVANG DEZE DOOR JE ECHTE PRODUCTIE URL**

    let selectedFile = null;
    let currentObjectUrl = null; // Voor het opschonen van de object URL

    // Functie om de UI te resetten naar de initiële staat (voor 'Opnieuw' knop)
    function handleReset() {
        selectedFile = null; // Wis het geselecteerde bestand
        fileInput.value = ''; // Wis de waarde van de file input (zodat dezelfde foto opnieuw geselecteerd kan worden)

        // Ruim de object URL op als deze bestaat
        if (currentObjectUrl) {
            URL.revokeObjectURL(currentObjectUrl);
            currentObjectUrl = null;
        }
        
        // Verberg alles behalve de initiële instructie en de 'Fotos' knop
        imagePreview.classList.add('hidden');
        imagePreview.src = '#'; // Wis de afbeelding bron

        errorMessage.classList.add('hidden');
        resultBox.classList.add('hidden');
        resetButton.classList.add('hidden'); // Verberg de 'Done' knop

        initialInstruction.classList.remove('hidden'); // Toon de initiële instructie
        photosButton.classList.remove('hidden'); // Zorg dat de 'Fotos' knop zichtbaar is
        
        uploadButton.disabled = true; // De upload knop is standaard disabled
        shutterButtonText.textContent = 'Upload'; // Tekst van de upload knop
    }

    // Functie om de file input en de upload knop status bij te werken
    function updateFileInputButtonState() {
        if (selectedFile) {
            // Maak een preview URL aan voor het geselecteerde bestand
            if (currentObjectUrl) {
                URL.revokeObjectURL(currentObjectUrl); // Ruim vorige URL op
            }
            currentObjectUrl = URL.createObjectURL(selectedFile);
            imagePreview.src = currentObjectUrl;
            imagePreview.classList.remove('hidden'); // Toon preview
            
            initialInstruction.classList.add('hidden'); // Verberg instructie als foto is gekozen
            photosButton.classList.add('hidden'); // Verberg 'Fotos' knop na selectie
            
            uploadButton.disabled = false;
            shutterButtonText.textContent = 'Upload'; // Zorg dat de tekst op 'Upload' staat
        } else {
            // In de initiële staat of na reset
            imagePreview.classList.add('hidden');
            initialInstruction.classList.remove('hidden');
            photosButton.classList.remove('hidden');
            
            uploadButton.disabled = true;
            shutterButtonText.textContent = 'Upload';
        }
    }

    // Event Listener voor bestand selectie
    fileInput.addEventListener('change', (event) => {
        const files = event.target.files;
        if (files && files.length > 0) {
            selectedFile = files[0];
            errorMessage.classList.add('hidden'); // Wis vorige foutmelding
            resultBox.classList.add('hidden'); // Verberg vorige resultaten
            resetButton.classList.add('hidden'); // Verberg reset knop bij nieuwe selectie
        } else {
            selectedFile = null;
        }
        updateFileInputButtonState(); // Update UI na bestand selectie
    });

    // Event Listener voor de upload knop
    uploadButton.addEventListener('click', async () => {
        if (!selectedFile) {
            errorMessage.textContent = 'Geen bestand geselecteerd om te uploaden.';
            errorMessage.classList.remove('hidden');
            return;
        }

        errorMessage.classList.add('hidden'); // Verberg foutmelding
        resultBox.classList.add('hidden'); // Verberg resultaten
        resetButton.classList.add('hidden'); // Verberg reset knop

        shutterButtonText.textContent = 'Verwerken...'; // Tekst van de knop
        uploadButton.disabled = true;
        photosButton.classList.add('hidden'); // Verberg de "Fotos" knop tijdens upload

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            console.log('Sending request to N8n webhook...'); 
            const response = await fetch(N8N_WEBHOOK_URL, {
                method: 'POST',
                body: formData,
            });

            console.log('Response status:', response.status); 
            console.log('Response headers:', response.headers); 

            if (!response.ok) {
                const errorDetail = await response.text();
                console.error('N8n response not OK:', errorDetail); 
                throw new Error(`Fout bij uploaden: ${response.status} - ${errorDetail || 'Onbekende fout'}`);
            }

            const rawResponseText = await response.text();
            console.log('Raw response text from N8n:', rawResponseText); 

            let jsonResult;
            try {
                jsonResult = JSON.parse(rawResponseText); 
                console.log('Parsed JSON result:', jsonResult); 
            } catch (jsonError) {
                console.error('Fout bij parsen van JSON:', jsonError); 
                throw new Error(`Fout bij parsen van N8n respons als JSON. Controleer of de respons geldige JSON is: ${jsonError.message}`);
            }
            
            const data = jsonResult; 
            console.log('Data object for display:', data); 

            if (data && typeof data === 'object') { 
                spanSoort.textContent = data.Soort || 'Niet gevonden';
                spanExoot.textContent = data['Invasieve exoot'] || 'Niet gevonden';
                spanZekerheid.textContent = (typeof data['Zekerheid identificatie'] === 'number') ? `${data['Zekerheid identificatie']}%` : (data['Zekerheid identificatie'] || 'Niet gevonden');
                
                if (data.Coordinaten === null || data.Coordinaten === undefined) {
                    spanLocatie.textContent = 'Onbekend';
                } else {
                    spanLocatie.textContent = data.Coordinaten;
                }
                
                resultBox.classList.remove('hidden'); // Toon de resultaatbox
                resetButton.classList.remove('hidden'); // Toon de 'Done' knop
                
                console.log('Resultaten succesvol getoond.'); 

            } else {
                errorMessage.textContent = 'Onverwacht formaat respons van de server. Verwacht een object met plantdetails.';
                errorMessage.classList.remove('hidden');
                console.error("N8n respons is geen geldig object voor weergave:", jsonResult); 
            }

        } catch (e) {
            console.error('Upload fout in try/catch blok:', e); 
            errorMessage.textContent = `Er ging iets mis: ${e.message || 'Onbekende fout'}. Controleer de console voor details.`;
            errorMessage.classList.remove('hidden');
        } finally {
            // Herstel de knopstatus, ongeacht succes of falen
            uploadButton.disabled = false;
            shutterButtonText.textContent = 'Upload'; // Tekst terug naar 'Upload'
        }
    });

    // NIEUW: Event listener voor de "Fotos" knop om de verborgen file input te triggeren
    photosButton.addEventListener('click', () => {
        fileInput.click(); // Activeer de bestandskiezer
    });

    // Event listener voor de "Opnieuw" (Done) knop
    resetButton.addEventListener('click', handleReset);

    // Initialiseer de UI bij het laden van de pagina
    handleReset(); // Gebruik de reset functie om de initiële staat in te stellen
});

// Zorg ervoor dat de object URL wordt ingetrokken wanneer de pagina wordt verlaten
window.addEventListener('beforeunload', () => {
    if (currentObjectUrl) {
        URL.revokeObjectURL(currentObjectUrl);
    }
});