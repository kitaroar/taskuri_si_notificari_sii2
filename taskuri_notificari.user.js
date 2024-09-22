// ==UserScript==
// @name         Trimitere Task si Notificari
// @namespace    https://kitaro.arad/taskuri.notificari.email
// @version      4.0
// @description  Sistem de management taskuri si notificari
// @author       ORCT_AR
// @match        *://rc-prod.onrc.sii/*
// @match        *://local.onrc.eu.org:3500/*
// @match        *://onrc.eu.org/*
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @connect      onrc.eu.org
// @updateURL    https://github.com/kitaroar/taskuri_si_notificari_sii2/raw/refs/heads/main/taskuri_notificari.user.js
// @downloadURL  https://github.com/kitaroar/taskuri_si_notificari_sii2/raw/refs/heads/main/taskuri_notificari.user.js
// ==/UserScript==

(function() {
    'use strict';

    // Definire variabile
    let userTaskuri = '';
    let usernameExpeditor = '';
    let usernameDestinatar = '';
    let numarInregistrare = '';
    let dataInregistrare = '';
    let registrator = '';
    let judr = '';
    let operator = '';
    let judo = '';
    let judcerere = '';
    let firma = '';
    let mailJudet = '';
    let formData = ''; // Will store form data (checkboxes and message)
    let taskuri = []; // Define taskuri globally

    //------Cookies------------------------------------------------------------

    // Function to get the value of a cookie by name
    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
    }

    // Funcție pentru a seta un cookie
    function setCookie(name, value, days) {
        let expires = "";
        if (days) {
            const date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = "; expires=" + date.toUTCString();
        }
        document.cookie = name + "=" + (value || "") + expires + "; path=/";
    }

    //------Toast Message---------------------------------------------------------

    GM_addStyle(`
    #toastContainer {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
    }

    .toast {
      display: none;
      min-width: 200px;
      margin-top: 52px;
      padding: 10px 30px;
      background-color: #333;
      color: Black;
      text-align: center;
      border-radius: 5px;
      font-size: 16px;
      opacity: 0;
      transition: opacity 0.5s ease-in-out;
    }

    .toast.success {
      background-color: PaleGreen;
      border: 2px solid DarkGreen;
    }

    .toast.error {
      background-color: PeachPuff;
      border: 2px solid DarkRed;
    }

    .toast.show {
      display: block;
      opacity: 1;
    }
    `);

    // Create a toast container (if it doesn't exist)
    if (!document.getElementById('toastContainer')) {
        const toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        document.body.appendChild(toastContainer);
    }

    // Function to show a toast message
    function showToast(message, type = 'success', duration = 5000) {
        // Create the toast element
        const toast = document.createElement('div');
        toast.classList.add('toast', type);
        toast.innerHTML = message;

        // Append the toast to the container
        document.getElementById('toastContainer').appendChild(toast);

        // Show the toast
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);

        // Hide the toast after the duration
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
            }, 500); // Wait for the fade-out transition to finish
        }, duration);
    }


    //-----Modal Message---------------------------------------------------------

    // Function to create a modal for messages
    function showMessageModal(message, iconClass, iconColor) {
        // Create modal container
        const messageModal = document.createElement('div');
        messageModal.style.position = 'fixed';
        messageModal.style.top = '0';
        messageModal.style.left = '0';
        messageModal.style.width = '100%';
        messageModal.style.height = '100%';
        messageModal.style.backgroundColor = 'rgba(0,0,0,0.5)';
        messageModal.style.display = 'flex';
        messageModal.style.justifyContent = 'center';
        messageModal.style.alignItems = 'center';
        messageModal.style.zIndex = 10001;

        // Create modal content
        const modalContent = document.createElement('div');
        modalContent.style.backgroundColor = 'white';
        modalContent.style.padding = '20px';
        modalContent.style.minWidth = '500px';
        modalContent.style.borderRadius = '10px';
        modalContent.style.textAlign = 'center';

        // Create icon
        const icon = document.createElement('i');
        icon.className = iconClass; // Font Awesome class
        icon.style.color = iconColor; // Custom icon color
        icon.style.fontSize = '48px'; // Icon size

        // Create message text
        const messageText = document.createElement('p');
        messageText.innerHTML = message;

        // Create OK button
        const okButton = document.createElement('button');
        okButton.innerHTML = 'Închide';
        okButton.style.marginTop = '10px';
        okButton.style.padding = '10px 25px';
        okButton.style.backgroundColor = 'Tomato';
        okButton.style.color = 'White';
        okButton.style.fontWeight = 'bold';
        okButton.style.border = '1px solid FireBrick';
        okButton.style.borderRadius = '5px';
        okButton.style.cursor = 'pointer';

        // Close modal on button click
        okButton.onclick = () => {
            messageModal.style.display = 'none';
            document.body.removeChild(messageModal); // Remove modal from DOM
        };

        // Append elements to modal content
        modalContent.appendChild(icon);
        modalContent.appendChild(messageText);
        modalContent.appendChild(okButton);

        // Append content to modal
        messageModal.appendChild(modalContent);

        // Append modal to document
        document.body.appendChild(messageModal);
    }

    //-----Modal Window----------------------------------------------------------

    // Funcție pentru a actualiza punctul de notificare
    function updateNotificationDot(numarTaskuri) {
        if (numarTaskuri > 0) {
            notificationDot.innerHTML = numarTaskuri; // Afișăm numărul de taskuri
            notificationDot.style.display = 'flex'; // Afișăm punctul de notificare
        } else {
            notificationDot.style.display = 'none'; // Ascundem punctul de notificare dacă nu există taskuri
        }
    }

    function openModalTasks(taskuri) {
        // Populăm tabelul modal cu taskuri
        populateTable(taskuri); // Populate modal with tasks
        modal.style.display = 'block'; // Afișăm modalul
    }

    // Creăm un modal pentru a afișa taskurile
    const modal = document.createElement('div');
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0,0,0,0.5)';
    modal.style.display = 'none'; // Ascundem modalul inițial
    modal.style.zIndex = 9999;
    modal.style.overflow = 'auto'; // Make modal scrollable

    // Conținutul modalului
    const modalContent = document.createElement('div');
    modalContent.style.backgroundColor = 'white';
    modalContent.style.margin = '5% auto';
    modalContent.style.padding = '20px';
    modalContent.style.paddingTop = '1px';
    modalContent.style.width = '80%';
    modalContent.style.borderRadius = '10px';
    modalContent.style.maxHeight = '90%'; // Limit height to make content scrollable
    modalContent.style.position = 'relative'; // Allow positioning child elements
    modalContent.innerHTML = `<h3 align='center'>Taskuri pentru utilizatorul: ${getCookie('userTaskuri') || getCookie("username") || "Necunoscut"}</h3>`

    // Creăm un container scrollable pentru tabel
    const tableContainer = document.createElement('div');
    tableContainer.style.maxHeight = '550px'; // Max height for the table scroll area
    tableContainer.style.overflowY = 'auto'; // Vertical scroll
    tableContainer.style.marginBottom = '20px'; // Space between table and buttons

    // Creăm tabelul pentru taskuri
    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse'; // Remove space between borders
    table.innerHTML = `
    <thead>
        <tr>
            <th style="border: 1px solid black; padding: 8px;">Data task</th>
            <th style="border: 1px solid black; padding: 8px;">Expeditor</th>
            <th style="border: 1px solid black; padding: 8px;">Cerere</th>
            <th style="border: 1px solid black; padding: 8px;">Problemă</th>
            <th style="border: 1px solid black; padding: 8px; text-align: center;">Rezolvat</th>
        </tr>
    </thead>
    <tbody></tbody>
`;

    // Funcție pentru a formata datele
    function formatDateTime(dateString) {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
        const year = date.getFullYear();
        const time = date.toLocaleTimeString('ro-RO'); // Get time in HH:mm:ss format
        return `${day}.${month}.${year}<br>${time}`;
    }

    // Funcție pentru a actualiza starea butonului "Trimite"
    function updateSubmitButtonState() {
        const checkedBoxes = table.querySelectorAll('input[type="checkbox"]:checked');
        submitButton.disabled = checkedBoxes.length === 0; // Enable button if at least one checkbox is checked
        submitButton.style.backgroundColor = submitButton.disabled ? 'lightgrey' : 'MediumSeaGreen';
        submitButton.style.cursor = submitButton.disabled ? 'normal' : 'pointer';
    }

    // Adăugăm tabelul la containerul scrollable
    tableContainer.appendChild(table);

    // Adăugăm containerul cu tabelul la modal
    modalContent.appendChild(tableContainer);

    // Creăm un container pentru butoane
    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.justifyContent = 'space-between';
    buttonContainer.style.marginTop = '10px'; // Add space between table and buttons

    // Creăm un buton "Trimite"
    const submitButton = document.createElement('button');
    submitButton.disabled = true; // Disable initially
    submitButton.innerHTML = 'Salvează';
    submitButton.style.padding = '10px 20px';
    submitButton.style.color = 'white';
    submitButton.style.border = 'none';
    submitButton.style.fontWeight = 'bold';
    submitButton.style.borderRadius = '5px';
    submitButton.style.cursor = submitButton.disabled ? 'normal' : 'pointer';
    submitButton.style.backgroundColor = submitButton.disabled ? 'darkgrey' : 'MediumSeaGreen';

    // Creăm un buton pentru închiderea modalului
    const closeButton = document.createElement('button');
    closeButton.innerHTML = 'Închide';
    closeButton.style.padding = '10px 20px';
    closeButton.style.backgroundColor = 'Salmon';
    closeButton.style.color = 'white';
    closeButton.style.border = 'none';
    closeButton.style.fontWeight = 'bold';
    closeButton.style.borderRadius = '5px';
    closeButton.style.cursor = 'pointer';

    // Închidem modalul la click pe butonul de închidere
    closeButton.onclick = () => {
        modal.style.display = 'none'; // Ascundem modalul când se apasă pe butonul close
    };

    // Adăugăm butonul "Trimite" și butonul "Închide" în container
    buttonContainer.appendChild(submitButton);
    buttonContainer.appendChild(closeButton);

    // Adăugăm containerul cu butoane la conținutul modalului
    modalContent.appendChild(buttonContainer);

    // Trimitem cererea la apăsarea butonului "Trimite"
    submitButton.onclick = () => {
        const checkedBoxes = table.querySelectorAll('input[type="checkbox"]:checked');
        const taskIds = Array.from(checkedBoxes).map(box => parseInt(box.getAttribute('data-task-id'))); // Collect IDs as integers
        const totalTaskuri = table.querySelectorAll('input[type="checkbox"]').length;

        // Trimitem cererea POST pentru a marca taskurile ca finalizate
        GM_xmlhttpRequest({
            method: "POST",
            url: "http://onrc.eu.org/api/client/finalizeaza-taskuri",
            //url: "http://local.onrc.eu.org:3500/api/client/finalizeaza-taskuri",
            headers: { "Content-Type": "application/json" },
            data: JSON.stringify({ids: taskIds}),
            onload: function(response) {
                const data = JSON.parse(response.responseText);
                if (data.status === "success") {
                    // Update numarTaskuri and the notification dot
                    const numarTaskuriNou = totalTaskuri - taskIds.length;
                    updateNotificationDot(numarTaskuriNou);
                    // Hide the modal after success
                    modal.style.display = 'none';
                    showMessageModal(data.message, 'fas fa-clipboard-check', 'green');
                } else {
                    showMessageModal(data.message, 'fas fa-triangle-exclamation', 'red');
                }
            },
            onerror: function() {
                showMessageModal('Eroare la trimiterea cererii', 'fas fa-triangle-exclamation', 'red');
            }
        });
    };

    // Adăugăm conținutul la modal
    modal.appendChild(modalContent);

    // Adăugăm modalul în document
    document.body.appendChild(modal);

    // Funcție pentru a popula tabelul cu taskuri
    function populateTable(taskuri) {
        const tbody = table.querySelector('tbody');
        tbody.innerHTML = ''; // Clear previous rows
        taskuri.forEach(task => {
            const row = document.createElement('tr');
            row.innerHTML = `
            <td style="border: 1px solid black; padding: 8px;">${formatDateTime(task.data_creare)}</td>
            <td style="border: 1px solid black; padding: 8px;">${task.expeditor.nume_utilizator}<br/>(${task.expeditor.email})</td>
            <td style="border: 1px solid black; padding: 8px; text-align: center;"><strong>${task.nr_cerere}</strong><br/>${task.data_cerere}</td>
            <td style="border: 1px solid black; padding: 8px;">${task.task}</td>
            <td style="border: 1px solid black; padding: 8px; text-align: center;">
                <input type="checkbox" style="transform: scale(1.6); accent-color: green" data-task-id="${task.id}">
            </td>
        `;
            tbody.appendChild(row);
        });

        // Adăugăm event listener pentru fiecare checkbox după ce sunt adăugate în DOM
        const checkboxes = tbody.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', updateSubmitButtonState);
        });
    }


    //-------Automatic Taskuri Fetch----------------------------------------

    // Function to fetch tasks and update the notification icon
    function fetchTasks() {
        const currentUser = getCookie("username");
        const taskUser = getCookie("userTaskuri");
        const fetchUser = taskUser || currentUser || "Necunoscut";
        console.log('Fetch User: ', fetchUser);
        if (fetchUser != "Necunoscut") {
            GM_xmlhttpRequest({
                method: "POST",
                url: "http://onrc.eu.org/api/client/citeste-taskuri",
                //url: "http://local.onrc.eu.org:3500/api/client/citeste-taskuri",
                headers: { "Content-Type": "application/json" },
                data: JSON.stringify({ username: fetchUser }),
                onload: function(response) {
                    try {
                        const data = JSON.parse(response.responseText);
                        const numarTaskuri = data.numarTaskuri; // Assuming this returns the new task count

                        updateNotificationDot(numarTaskuri); // Update notification dot

                    } catch (e) {
                        console.error("Eroare la primirea răspunsului JSON:", e);
                    }
                },
                onerror: function() {
                    console.error("Eroare la trimiterea cererii.");
                }
            });
        }
    }

    // Run the fetchTasks function after all elements are loaded
    window.onload = function() {
        fetchTasks(); // Initial fetch
        setInterval(fetchTasks, 10 * 60 * 1000); // Fetch every 10 minutes
    };


    //----Notificari--------------------------------------------------------

    // Include Font Awesome for the bell icon
    const fontAwesomeLink = document.createElement('link');
    fontAwesomeLink.rel = 'stylesheet';
    fontAwesomeLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css';
    document.head.appendChild(fontAwesomeLink);

    // Creăm un buton pe pagina web pentru notificări
    const notificationButton = document.createElement('button');

    // Adăugăm iconița clopoțel
    notificationButton.innerHTML = '<i class="fas fa-bell"></i>';

    // Stilizare buton
    notificationButton.style.position = 'fixed'; // Facem butonul vizibil permanent
    notificationButton.style.top = '0px'; // Plasăm butonul în colțul din dreapta jos
    notificationButton.style.right = '230px';
    notificationButton.style.width = '48px'; // Setăm lățimea egală cu înălțimea
    notificationButton.style.height = '48px';
    notificationButton.style.padding = '10px';
    notificationButton.style.borderRadius = '50%'; // Button round like a bell
    notificationButton.style.fontSize = '22px'; // Size of the bell icon
    notificationButton.style.color = '#FFF';
    notificationButton.style.backgroundColor = 'transparent';
    notificationButton.style.border = '0px solid white';
    notificationButton.style.zIndex = 3000;
    notificationButton.style.cursor = 'pointer';

    // Optional: Adăugăm un punct roșu pentru notificări
    const notificationDot = document.createElement('span');
    notificationDot.innerHTML = '0'; // Exemplu de notificări necitite
    notificationDot.style.position = 'absolute';
    notificationDot.style.top = '2px';
    notificationDot.style.right = '2px';
    notificationDot.style.backgroundColor = 'red';
    notificationDot.style.color = 'white';
    notificationDot.style.borderRadius = '50%';
    notificationDot.style.padding = '3px';
    notificationDot.style.fontSize = '12px';
    notificationDot.style.fontWeight = 'bold';
    notificationDot.style.width = '20px';
    notificationDot.style.height = '20px';
    notificationDot.style.display = 'none'; // Ascundem inițial punctul de notificare
    //notificationDot.style.display = 'flex';
    notificationDot.style.justifyContent = 'center';
    notificationDot.style.alignItems = 'center'; // Center the bell icon

    // Adăugăm punctul de notificare la buton
    notificationButton.appendChild(notificationDot);

    // Adăugăm butonul pe document
    document.body.appendChild(notificationButton);

    // Event listener pentru clic pe buton
    notificationButton.addEventListener('click', () => {
        const currentUser = getCookie("username");
        const taskUser = getCookie("userTaskuri");
        const fetchUser = taskUser || currentUser || "Necunoscut";
        console.log('Fetch User: ', fetchUser);
        if (fetchUser != "Necunoscut") {
            GM_xmlhttpRequest({
                method: "POST",
                url: "https://onrc.eu.org/api/client/citeste-taskuri",
                //url: "http://local.onrc.eu.org:3500/api/client/citeste-taskuri",
                headers: { "Content-Type": "application/json" },
                data: JSON.stringify({username: fetchUser}),
                onload: function(response) {
                    try {
                        // Parse the JSON response text
                        var data = JSON.parse(response.responseText);
                        //console.log("Răspuns de API:", response.responseText);
                        // Actualizăm punctul de notificare pe baza numărului de taskuri
                        updateNotificationDot(data.numarTaskuri);
                        if (data.numarTaskuri > 0) {
                            openModalTasks(data.taskuri);
                        } else {
                            //showMessageModal(data.message, 'fas fa-triangle-exclamation', 'orange');
                            showToast(data.message, 'error', 7000);
                        }

                    } catch (e) {
                        console.error("Eroare la primirea răspunsului JSON:", e);
                        showMessageModal('A apărut o eroare la primirea răspunsului de la server', 'fas fa-triangle-exclamation', 'red');
                    }
                },
                onerror: function(response) {
                    console.log("Eroare la trimiterea datelor:", response);
                    showMessageModal('A apărut o eroare la trimiterea datelor', 'fas fa-triangle-exclamation', 'red');
                }
            });
        } else {
            showMessageModal('Lipsă nume utilizator<br/><br/>Dă LogOut apoi întră din nou în program', 'fas fa-triangle-exclamation', 'red');
        }
    });

    //--------Buton pentru schimbare user------------------------------------------------------

    // Creăm un buton pe pagina web pentru notificări
    const setariButton = document.createElement('button');

    // Adăugăm iconița
    setariButton.innerHTML = '<i class="fas fa-id-card-clip"></i>';

    // Stilizare buton
    setariButton.style.position = 'fixed'; // Facem butonul vizibil permanent
    setariButton.style.bottom = '10px'; // Plasăm butonul în colțul din stânga jos
    setariButton.style.left = '4px';
    setariButton.style.width = '32px'; // Setăm lățimea egală cu înălțimea
    setariButton.style.height = '32px';
    setariButton.style.padding = '5px';
    setariButton.style.borderRadius = '50%'; // Button round like a bell
    setariButton.style.fontSize = '20px'; // Size of the bell icon
    setariButton.style.color = 'CornflowerBlue';
    setariButton.style.backgroundColor = 'transparent';
    setariButton.style.border = '0px solid orange';
    setariButton.style.zIndex = 2000;
    setariButton.style.cursor = 'pointer';

    // Adăugăm butonul pe document
    document.body.appendChild(setariButton);

    // Creăm un modal pentru setări
    const modalSetari = document.createElement('div');
    modalSetari.style.position = 'fixed';
    modalSetari.style.top = '0';
    modalSetari.style.left = '0';
    modalSetari.style.width = '100%';
    modalSetari.style.height = '100%';
    modalSetari.style.backgroundColor = 'rgba(0,0,0,0.5)';
    modalSetari.style.display = 'none';
    modalSetari.style.zIndex = 10001;

    // Conținutul modalului
    const modalContentSetari = document.createElement('div');
    modalContentSetari.style.backgroundColor = 'white';
    modalContentSetari.style.margin = '10% auto';
    modalContentSetari.style.padding = '20px';
    modalContentSetari.style.width = '600px';
    modalContentSetari.style.borderRadius = '10px';

    // Creăm input-urile pentru nume utilizator
    const currentUser = getCookie("username") || "Utilizator necunoscut";

    // Stiluri pentru input-uri în stil MUI
    const inputStyle = `
    width: 100%;
    padding: 10px;
    font-size: 16px;
    border-radius: 4px;
    border: 1px solid #ccc;
    box-sizing: border-box;
    margin-top: 8px;
    margin-bottom: 4px;
    margin-left: 10px;
    transition: border-color 0.3s;
    `;

    const labelStyle = `
    display: block;
    font-size: 14px;
    margin-top: 5px;
    `;

    const radioStyle = `
    display: flex;
    align-items: center;
    margin-bottom: 16px;
    `;

    modalContentSetari.innerHTML = `
    <p style="margin-bottom: 16px; font-size: 18px">Utilizatorul curent pentru notificări este: <strong>${getCookie("userTaskuri") || "Utilizator necunoscut"}</strong></p>
    <hr>
    <h3 style="margin-bottom: 16px;">Setează noul utilizator pentru notificări taskuri</h3>
    <div style="${radioStyle}">
        <input type="radio" name="username" value="${getCookie("username") || "Utilizator necunoscut"}" checked>
        <label style="margin-left: 8px; margin-top: 5px;">${getCookie("username") || "Utilizator necunoscut"}</label>
    </div>
    <div style="${radioStyle}">
        <input type="radio" name="username" value="nou">
        <input type="text" id="nouUsername" placeholder="Alt utilizator" style="${inputStyle}">
    </div>
    `;

    // Creăm un container pentru butoane
    const setariContainer = document.createElement('div');
    setariContainer.style.display = 'flex';
    setariContainer.style.justifyContent = 'space-between';
    setariContainer.style.marginTop = '10px'; // Add space between table and buttons

    // Butonul Salvare
    const saveButton = document.createElement('button');
    saveButton.innerHTML = 'Salvare';
    saveButton.style.padding = '10px 20px';
    saveButton.style.backgroundColor = 'MediumSeaGreen';
    saveButton.style.color = 'white';
    saveButton.style.border = 'none';
    saveButton.style.fontWeight = 'bold';
    saveButton.style.borderRadius = '5px';
    saveButton.style.cursor = 'pointer';

    // Butonul Renunță
    const cancelButton = document.createElement('button');
    cancelButton.innerHTML = 'Renunță';
    cancelButton.style.padding = '10px 20px';
    cancelButton.style.backgroundColor = 'Salmon';
    cancelButton.style.color = 'white';
    cancelButton.style.border = 'none';
    cancelButton.style.fontWeight = 'bold';
    cancelButton.style.borderRadius = '5px';
    cancelButton.style.cursor = 'pointer';

    // Funcția pentru a salva numele de utilizator în cookie
    saveButton.onclick = () => {
        const selectedRadio = document.querySelector('input[name="username"]:checked');
        let selectedUsername = selectedRadio.value;
        if (selectedUsername === "nou") {
            selectedUsername = document.getElementById('nouUsername').value;
        }

        // Salvăm valoarea în cookie
        setCookie("userTaskuri", selectedUsername, 365); // Expiră în 365 de zile
        showMessageModal(`Noul utilizator pentru alerte taskuri este: <strong>${selectedUsername}</strong>`, 'fas fa-circle-info', 'SkyBlue');
        modalSetari.style.display = 'none';
        fetchTasks();
    };

    // Închidem modalul la click pe butonul Renunță
    cancelButton.onclick = () => {
        modalSetari.style.display = 'none';
    };

    // Adăugăm butoanele în conținutul modalului
    setariContainer.appendChild(saveButton);
    setariContainer.appendChild(cancelButton);

    modalContentSetari.appendChild(setariContainer);

    // Adăugăm conținutul modalului în modal
    modalSetari.appendChild(modalContentSetari);

    // Adăugăm modalul în document
    document.body.appendChild(modalSetari);

    // Deschidem modalul la click pe butonul Setări
    setariButton.onclick = () => {
        modalSetari.style.display = 'block';
    };


    //------Buton pentru adaugare task--------------------------------------------------------

    // Creăm un buton pe pagina web
    const button = document.createElement('button');
    button.innerHTML = 'Adaugă Task';
    button.style.position = 'fixed'; // Facem butonul vizibil permanent
    button.style.bottom = '10px'; // Plasăm butonul în colțul din dreapta jos
    button.style.right = '20px';
    button.style.padding = '4px 10px';
    button.style.borderRadius = '3px';
    button.style.color = '#FFF';
    button.style.backgroundColor = 'orange';
    button.style.border = '1px solid orange';
    button.style.zIndex = 1000;

    // Adăugăm butonul în document
    document.body.appendChild(button);

    // Add event listener to the button to open the form
    button.addEventListener('click', function() {

        usernameExpeditor = getCookie('username') || 'Necunoscut';
        if(usernameExpeditor === 'Necunoscut'){
            //showMessageModal('Username necunoscut. <br/><br/>Te rog să dai LogOut și să intri din nou în program', 'fas fa-triangle-exclamation', 'orange');
            //return; // Prevent form to open
        }

        const headers = document.querySelectorAll('th.ant-table-cell');

        let columnIndexes = {
            numarInregistrare: -1,
            dataInregistrare: -1,
            registrator: -1,
            operator: -1
        };

        // Find the column indices based on the header text
        headers.forEach((header, index) => {
            const headerText = header.innerText.trim();
            if (headerText.includes('Număr înregistrare')) {
                columnIndexes.numarInregistrare = index;
            } else if (headerText.includes('Dată înregistrare')) {
                columnIndexes.dataInregistrare = index;
            } else if (headerText.includes('Judet cerere')) {
                columnIndexes.judcerere = index;
            }else if (headerText.includes('Registrator')) {
                columnIndexes.registrator = index;
            } else if (headerText.includes('Judet registrator')) {
                columnIndexes.judr = index;
            } else if (headerText.includes('Firmă')) {
                columnIndexes.firma = index;
            } else if (headerText.includes('Operator')) {
                columnIndexes.operator = index;
            } else if (headerText.includes('Judet operator')) {
                columnIndexes.judo = index;
            } else if (headerText.includes('Firmă')) {
                columnIndexes.firma = index;
            }
        });

        // Select the 3rd row (excluding the header and filter rows)
        //const thirdRow = document.querySelectorAll('tr.ant-table-row')[2];

        const currentUrl = window.location.href;
        //if (currentUrl.substr(currentUrl.length - 7) != 'process') {
        if (currentUrl.indexOf('/search-applications/process') !== -1) {
            const cereriInLista = document.querySelectorAll('tr.ant-table-row').length-2; //numarul de cereri existente in lista
            if (cereriInLista===0) { // daca nu e nicio cerere
                //console.log('no rows');
                //showMessageModal('Nu există nici o cerere în listă', 'fas fa-triangle-exclamation', 'orange');
                //return; // Prevent form submission
            }
            let selectedRow = document.querySelectorAll('tr.ant-table-row')[2]; // implicit iau prima cerere care apare in lista chiar daca nu e selectata
            if (cereriInLista>1) { // daca exista mai mult de o cerere in lista, o iau pe cea care are clasa selected-row
                selectedRow = document.querySelectorAll('tr.ant-table-row.selected-row')[0];
            }
            if (selectedRow) { // daca exista o cerere selectata
                    const cells = selectedRow.querySelectorAll('td');
                    numarInregistrare = cells[columnIndexes.numarInregistrare]?.innerText.trim() || 'Necunoscut';
                    dataInregistrare = cells[columnIndexes.dataInregistrare]?.innerText.trim() || 'Necunoscut';
                    judcerere = cells[columnIndexes.judcerere]?.innerText.trim() || 'Necunoscut';
                    registrator = cells[columnIndexes.registrator]?.innerText.trim() || 'Necunoscut';
                    judr = cells[columnIndexes.judr]?.innerText.trim() || 'Necunoscut';
                    operator = cells[columnIndexes.operator]?.innerText.trim() || 'Necunoscut';
                    judo = cells[columnIndexes.judo]?.innerText.trim() || 'Necunoscut';
                    firma = cells[columnIndexes.firma]?.innerText.trim() || 'Necunoscut';
            } else { // daca nu exista selectedRow inseamna ca sunt mai multe in lista si nu s-a ales una
                //console.log('no row selected');
                showMessageModal('Selectează mai întâi o cerere din listă', 'fas fa-triangle-exclamation', 'orange');
                return; // Prevent form submission
            }
        } else {
            //console.log('3rd row not found');
            showMessageModal('Nu ești în fereastra care trebuie!<br/><br/>Intră la Procesare cereri și caută un număr de dosar', 'fas fa-triangle-exclamation', 'orange');
            return; // Prevent form submission
        }

        if(numarInregistrare === 'Necunoscut' || dataInregistrare === 'Necunoscut' ){
            showMessageModal('Nu ești în fereastra care trebuie!<br/><br/>Intră la Procesare cereri și caută un număr de dosar', 'fas fa-triangle-exclamation', 'orange');
            return; // Prevent form to open
        }

        createModalForm();
    });

    // Function to create and display the form
    function createModalForm() {

        // Create a modal backdrop
        const modalBackdrop = document.createElement('div');
        modalBackdrop.id = 'modalBackdrop';
        modalBackdrop.style.position = 'fixed';
        modalBackdrop.style.top = '0';
        modalBackdrop.style.left = '0';
        modalBackdrop.style.width = '100%';
        modalBackdrop.style.height = '100%';
        modalBackdrop.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        modalBackdrop.style.zIndex = '9999';

        // Create the form container
        const formContainer = document.createElement('div');
        formContainer.id = 'customForm';
        formContainer.style.position = 'fixed';
        formContainer.style.top = '20%';
        formContainer.style.left = '30%';
        formContainer.style.backgroundColor = 'white';
        formContainer.style.border = '1px solid #ccc';
        formContainer.style.padding = '30px';
        formContainer.style.borderRadius = '10px';
        formContainer.style.zIndex = 10000;
        formContainer.style.width = '600px';
        formContainer.style.boxShadow = '0px 4px 10px rgba(0, 0, 0, 0.1)';


        // Create the close button
        const closeButton = document.createElement('span');
        closeButton.innerHTML = '<i class="fa-solid fa-rectangle-xmark"></i>';
        closeButton.style.position = 'absolute';
        closeButton.style.top = '0px';
        closeButton.style.right = '8px';
        closeButton.style.padding = '0px 0px';
        closeButton.style.borderRadius = '4px';
        closeButton.style.cursor = 'pointer';
        closeButton.style.fontSize = '32px';
        closeButton.style.fontWeight = 'bolder';
        closeButton.style.color = 'Tomato';

        closeButton.addEventListener('click', function () {
        document.body.removeChild(modalBackdrop); // Close the modal form and backdrop when 'X' is clicked
        });

        // Create the cancel button
        const cancelButton = document.createElement('button');
        cancelButton.innerHTML = 'Renunță';
        cancelButton.style.position = 'absolute';
        cancelButton.style.bottom = '20px';
        cancelButton.style.right = '20px';
        cancelButton.style.padding = '2px 10px';
        cancelButton.style.border = '1px solid #AAA';
        cancelButton.style.fontSize = '16px';
        cancelButton.style.borderRadius = '3px';
        cancelButton.style.zIndex = 1000;
        cancelButton.style.backgroundColor = 'seashell';
        cancelButton.style.cursor = 'pointer';

        cancelButton.addEventListener('click', function() {
            document.body.removeChild(modalBackdrop); // Close the modal form when 'Cancel' is clicked
        });

        // Append the close and cancel buttons
        formContainer.appendChild(closeButton);
        formContainer.appendChild(cancelButton);

        // Create the form element
        const formElement = document.createElement('form');
        formElement.id = 'myForm';

        // Set initial radio button states
        let operatorChecked = '';
        let registratorChecked = '';

        // Append the checkboxes and text area to the form
        const formContent = `
            <h3>Cererea Nr. <strong>${numarInregistrare}</strong> / <strong>${dataInregistrare}</strong></h3>
            <h3>Pentru firma: <strong>${firma}</strong> din <strong>${judcerere}</strong></h3>
            <hr>
            <div>
                <input type="checkbox" id="option1" name="options" value="Încărcați în opis încheierea semnată">
                <label for="option1">Încărcați în opis încheierea semnată</label><br>
            </div>
            <div>
                <input type="checkbox" id="option2" name="options" value="Încărcați în opis încheierea nesemnată">
                <label for="option2">Încărcați în opis încheierea nesemnată</label><br>
            </div>
            <div>
                <input type="checkbox" id="option3" name="options" value="Corectați opisul cererii de la pagina - la pagina">
                <label for="option3">Corectați opisul cererii de la pagina - la pagina</label><br>
            </div>
            <div>
                <input type="checkbox" id="option4" name="options" value="Procesați cererea">
                <label for="option4">Procesați cererea</label><br>
            </div>
            <div>
                <input type="checkbox" id="option5" name="options" value="Soluționați cererea">
                <label for="option5">Soluționați cererea</label><br>
            </div>
            <div>
                <input type="checkbox" id="option6" name="options" value="Solicitare cazier">
                <label for="option6">Solicitare cazier</label><br>
            </div>
            <br/>
            <div>
                <label for="messageBox">Alte probleme:</label><br>
                <textarea id="messageBox" name="message" rows="4"style="width: 100%;" ></textarea><br><br>
            </div>
            <div>
        <label>Trimite către:</label><br>

        <!-- Operator Checkbox -->
        <input type="checkbox" id="operatorCheckbox" name="role" value="${operator}" ${operatorChecked} ${( (usernameExpeditor === operator) || (operator === 'Necunoscut') ) ? 'disabled' : ''}>
        <label for="operatorCheckbox">Operator - ${operator} (${judo})</label><br>

        <!-- Registrator Checkbox -->
        <input type="checkbox" id="registratorCheckbox" name="role" value="${registrator}" ${registratorChecked} ${( (usernameExpeditor === registrator) || (registrator === 'Necunoscut') ) ? 'disabled' : ''}>
        <label for="registratorCheckbox">Registrator - ${registrator} (${judr})</label><br>

        <!-- ORCT Checkbox with Dropdown -->
        <div style="display: flex; align-items: center;">
            <input type="checkbox" id="orctCheckbox" name="role" value="ORCT">
            <label for="orctCheckbox">&nbsp;ORCT</label>

            <!-- Dropdown next to ORCT checkbox -->
            <select id="countySelect" style="margin-left: 10px;" disabled>
                <option value="orcab@ab.onrc.ro" ${judcerere === 'Alba' ? 'selected' : ''}>Alba</option>
                <option value="orcar@ar.onrc.ro" ${judcerere === 'Arad' ? 'selected' : ''}>Arad</option>
                <option value="orcag@ag.onrc.ro" ${judcerere === 'Argeş' ? 'selected' : ''}>Argeş</option>
                <option value="orcbc@bc.onrc.ro" ${judcerere === 'Bacău' ? 'selected' : ''}>Bacău</option>
                <option value="orcbh@bh.onrc.ro" ${judcerere === 'Bihor' ? 'selected' : ''}>Bihor</option>
                <option value="orcbn@bn.onrc.ro" ${judcerere === 'Bistriţa-Năsăud' ? 'selected' : ''}>Bistriţa-Năsăud</option>
                <option value="orcbt@bt.onrc.ro" ${judcerere === 'Botoşani' ? 'selected' : ''}>Botoşani</option>
                <option value="orcbv@bv.onrc.ro" ${judcerere === 'Braşov' ? 'selected' : ''}>Braşov</option>
                <option value="orcbr@br.onrc.ro" ${judcerere === 'Brăila' ? 'selected' : ''}>Brăila</option>
                <option value="orcb@b.onrc.ro" ${judcerere === 'Bucureşti' ? 'selected' : ''}>Bucureşti</option>
                <option value="orcbz@bz.onrc.ro" ${judcerere === 'Buzău' ? 'selected' : ''}>Buzău</option>
                <option value="orccs@cs.onrc.ro" ${judcerere === 'Caraş-Severin' ? 'selected' : ''}>Caraş-Severin</option>
                <option value="orccj@cj.onrc.ro" ${judcerere === 'Cluj' ? 'selected' : ''}>Cluj</option>
                <option value="orcct@ct.onrc.ro" ${judcerere === 'Constanţa' ? 'selected' : ''}>Constanţa</option>
                <option value="orccv@cv.onrc.ro" ${judcerere === 'Covasna' ? 'selected' : ''}>Covasna</option>
                <option value="orccl@cl.onrc.ro" ${judcerere === 'Călăraşi' ? 'selected' : ''}>Călăraşi</option>
                <option value="orcdj@dj.onrc.ro" ${judcerere === 'Dolj' ? 'selected' : ''}>Dolj</option>
                <option value="orcdb@db.onrc.ro" ${judcerere === 'Dâmboviţa' ? 'selected' : ''}>Dâmboviţa</option>
                <option value="orcgl@gl.onrc.ro" ${judcerere === 'Galați' ? 'selected' : ''}>Galați</option>
                <option value="orcgr@gr.onrc.ro" ${judcerere === 'Giurgiu' ? 'selected' : ''}>Giurgiu</option>
                <option value="orcgj@gj.onrc.ro" ${judcerere === 'Gorj' ? 'selected' : ''}>Gorj</option>
                <option value="orchr@hr.onrc.ro" ${judcerere === 'Harghita' ? 'selected' : ''}>Harghita</option>
                <option value="orchd@hd.onrc.ro" ${judcerere === 'Hunedoara' ? 'selected' : ''}>Hunedoara</option>
                <option value="orcil@il.onrc.ro" ${judcerere === 'Ialomiţa' ? 'selected' : ''}>Ialomiţa</option>
                <option value="orcis@is.onrc.ro" ${judcerere === 'Iaşi' ? 'selected' : ''}>Iaşi</option>
                <option value="orcif@if.onrc.ro" ${judcerere === 'Ilfov' ? 'selected' : ''}>Ilfov</option>
                <option value="orcmm@mm.onrc.ro" ${judcerere === 'Maramureş' ? 'selected' : ''}>Maramureş</option>
                <option value="orcmh@mh.onrc.ro" ${judcerere === 'Mehedinţi' ? 'selected' : ''}>Mehedinţi</option>
                <option value="orcms@ms.onrc.ro" ${judcerere === 'Mureş' ? 'selected' : ''}>Mureş</option>
                <option value="orcnt@nt.onrc.ro" ${judcerere === 'Neamţ' ? 'selected' : ''}>Neamţ</option>
                <option value="orcot@ot.onrc.ro" ${judcerere === 'Olt' ? 'selected' : ''}>Olt</option>
                <option value="orcph@ph.onrc.ro" ${judcerere === 'Prahova' ? 'selected' : ''}>Prahova</option>
                <option value="orcsm@sm.onrc.ro" ${judcerere === 'Satu Mare' ? 'selected' : ''}>Satu Mare</option>
                <option value="orcsb@sb.onrc.ro" ${judcerere === 'Sibiu' ? 'selected' : ''}>Sibiu</option>
                <option value="orcsv@sv.onrc.ro" ${judcerere === 'Suceava' ? 'selected' : ''}>Suceava</option>
                <option value="orcsj@sj.onrc.ro" ${judcerere === 'Sălaj' ? 'selected' : ''}>Sălaj</option>
                <option value="orctr@tr.onrc.ro" ${judcerere === 'Teleorman' ? 'selected' : ''}>Teleorman</option>
                <option value="orctm@tm.onrc.ro" ${judcerere === 'Timiş' ? 'selected' : ''}>Timiş</option>
                <option value="orctl@tl.onrc.ro" ${judcerere === 'Tulcea' ? 'selected' : ''}>Tulcea</option>
                <option value="orcvs@vs.onrc.ro" ${judcerere === 'Vaslui' ? 'selected' : ''}>Vaslui</option>
                <option value="orcvn@vn.onrc.ro" ${judcerere === 'Vrancea' ? 'selected' : ''}>Vrancea</option>
                <option value="orcvl@vl.onrc.ro" ${judcerere === 'Vâlcea' ? 'selected' : ''}>Vâlcea</option>
            </select>
        </div>
    </div>
            <br/><br/>
            <input type="submit" value="Trimite" style="cursor: pointer; position: absolute; bottom: 20px; background-color: honeydew; left: 20px; padding: 2px 10px; border: 1px solid #AAA; font-size: 16px; border-radius: 3px; z-index: 1000;">
        `;

        // Append the form content to the form
        formElement.innerHTML = formContent;

        // Append the form to the form container
        formContainer.appendChild(formElement);

        // Add the form container to the backdrop
        modalBackdrop.appendChild(formContainer);

        // Add the modal backdrop to the body
        document.body.appendChild(modalBackdrop)

        document.getElementById('orctCheckbox').addEventListener('change', function() {
        const countySelect = document.getElementById('countySelect');
        countySelect.disabled = !this.checked; // Enable dropdown when ORCT is checked
        });

        // Ensure that only one of the checkboxes (operator or registrator) is checked at a time
        const operatorCheckbox = document.getElementById('operatorCheckbox');
        const registratorCheckbox = document.getElementById('registratorCheckbox');

        // Logic to disable operator or registrator based on the current user's role
        if (usernameExpeditor === operator) {
            operatorCheckbox.disabled = true; // Disable operator checkbox if user is operator
        } else if (usernameExpeditor === registrator) {
            registratorCheckbox.disabled = true; // Disable registrator checkbox if user is registrator
        }

        // Add event listener for form submission
        document.getElementById('myForm').addEventListener('submit', function(event) {
            event.preventDefault();

            // Get selected checkboxes
            let selectedOptions = [];
            document.querySelectorAll('input[name="options"]:checked').forEach((checkbox) => {
                selectedOptions.push(checkbox.value);
            });

            // Get the message box content
            let message = document.getElementById('messageBox').value.trim();

            // Get the selected role
            let role = document.querySelector('input[name="role"]:checked')?.value || 'Necunoscut';

            // Combine selected checkboxes, message, and role into one string
            // Combine selected checkboxes and message into one string
            if (selectedOptions.length > 0) {
                formData = selectedOptions.join(', ');
            } else {
                formData = ''; // No checkboxes selected
            }

            if (message) {
                // If there are selected options, append with a comma, otherwise just add the message
                formData += formData ? ', ' + message : message;
            }

            // Check if a message is empty
            if (formData.length==0) {
                showMessageModal('Bifează un mesaj sau scrie mesajul în caseta text', 'fas fa-triangle-exclamation', 'orange');
                return; // Prevent form submission
            }
            // Check if a destination is selected
            if (!document.querySelector('input[name="role"]:checked')) {
                showMessageModal('Alege un destinatar pentru mesaj', 'fas fa-triangle-exclamation', 'orange');
                return; // Prevent form submission
            }

            // Get elements
            mailJudet = '';
            const operatorCheckbox = document.getElementById('operatorCheckbox');
            const registratorCheckbox = document.getElementById('registratorCheckbox');
            const orctCheckbox = document.getElementById('orctCheckbox');
            const countySelect = document.getElementById('countySelect');

            if (orctCheckbox.checked) {mailJudet = countySelect.value;} // Get the selected value from dropdown}

            if (operatorCheckbox.checked && registratorCheckbox.checked) {
                usernameDestinatar = JSON.stringify({operator: operator, registrator: registrator});
            } else if (registratorCheckbox.checked && !operatorCheckbox.checked) {
                usernameDestinatar = registrator;
            } else if (!registratorCheckbox.checked && operatorCheckbox.checked) {
                usernameDestinatar = operator;
            } else if (orctCheckbox.checked) {
                usernameDestinatar = mailJudet;
            }

            // Log the form data
            //console.log("Mesaj de trimis:", formData);
            //console.log("Destinatar: ", usernameDestinatar);

            // Call function to collect page data and submit everything
            collectDataAndSubmit();

            // Remove the form after submission
            document.body.removeChild(modalBackdrop);
        });
    }

    // Function to collect data from the page and submit everything
    function collectDataAndSubmit() {

        // Variabile pentru test -> COMENTEAZĂ ÎN PRODUCȚIE
        //usernameExpeditor = 'adriana.mirea';
        //numarInregistrare = '9999999';
        //dataInregistrare = '31.12.2024';
        //judcerere = 'Arad';
        //registrator = 'alexandra.decean';
        //operator = 'madalina.manda';
        //usernameDestinatar = JSON.stringify({registrator: registrator, operator: operator});
        //usernameDestinatar = 'alexandra.decean';
        //firma = 'TEST SRL';

        const dateDeTrimis = JSON.stringify({
            numarInregistrare: numarInregistrare,
            dataInregistrare: dataInregistrare,
            usernameDestinatar: usernameDestinatar,
            usernameExpeditor: usernameExpeditor,
            formData: formData,
        })

        console.log("Date transmise: ", dateDeTrimis);

        // Trimiterea datelor către Google Apps Script prin POST request
        GM_xmlhttpRequest({
            method: "POST",
            url: "https://onrc.eu.org/api/administrator/adauga-task",
            //url: "http://local.onrc.eu.org:3500/api/administrator/adauga-task",
            headers: { "Content-Type": "application/json" },
            data: dateDeTrimis,
            onload: function(response) {
                try {
                    // Parse the JSON response text
                    var data = JSON.parse(response.responseText);
                    //console.log("Email Utilizator:", data.emailUtilizator);
                    //console.log("Răspuns de API:", response.responseText);
                    //showMessageModal(data.message, 'fas fa-triangle-exclamation', 'orange');
                    showToast(data.message, 'success', 6000);

                    let emailDestinatar = data.emailUtilizator || 'Introdu adresa de email';
                    let subiect = 'Referitor la cererea: ' + numarInregistrare + ' din ' + dataInregistrare; // Subiectul emailului
                    let corpEmail = 'Vă rugăm să remediați cererea: ' + numarInregistrare + ' din ' + dataInregistrare + '\n\nProbleme semnalate: ' + formData;
                    if (data.emailDestinatar2 && data.emailDestinatar2.includes('@')) {
                        emailDestinatar += ',' + data.emailDestinatar2; // Add Destinatar2 to the recipients list if valid
                    }
                    if (mailJudet && mailJudet.includes('@') && mailJudet != emailDestinatar) {
                        emailDestinatar += ',' + mailJudet; // Add mailJudet to the recipients list if valid
                    }

                    // Construim URL-ul de tip mailto
                    let mailtoLink = 'mailto:' + emailDestinatar + '?subject=' + encodeURIComponent(subiect) + '&body=' + encodeURIComponent(corpEmail);

                    // Deschidem clientul de email implicit
                    window.location.href = mailtoLink;

                } catch (e) {
                    console.error("Eroare la primirea răspunsului JSON:", e);
                    showMessageModal('A apărut o eroare la primirea răspunsului', 'fas fa-triangle-exclamation', 'orange');
                }
            },
            onerror: function(response) {
                console.log("Eroare la trimiterea datelor:", response);
                showMessageModal('A apărut o eroare la trimiterea datelor', 'fas fa-triangle-exclamation', 'orange');
            }
        });
    }

})();
