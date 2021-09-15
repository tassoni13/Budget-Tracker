let db;
let budgetVersion;

//Create new db request for budget database
const request = indexedDB.open('budget', budgetVersion || 1);

request.onupgradeneeded = function (e) {
    console.log('Upgrade needed in IndexDB');

    const { oldVersion } = e;
    const newVersion = e.newVersion || db.version;

    console.log(`DB Updated from version ${oldVersion} to ${newVersion}`);

    db = e.target.result;

    if (db.objectStoreNames.length === 0) {
        db.createObjectStore('transactions', {autoIncrement: true});
    }
};

request.onerror = function (e) {
    console.log(`Woops! ${e.target.errorCode}`);
};

function checkDatabase() {
    console.log('check db invoked');

    //Open a transaction
    let transaction = db.transaction(['transactions'], 'readwrite');

    //Access transactions object
    const store = transaction.objectStore('transactions');

    //Get all records from store and set to variable
    const getAll = store.getAll();

    //If request successful
    getAll.onsuccess = function () {
        //Bulk adds items in store when back online
        if (getAll.result.length > 0) {
            fetch('/api/transaction/bulk', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json',
                },
            })
            .then((response) => response.json())
            .then((res) => {
                if(res.length !== 0) {
                    //Open another transaction with read write access
                    transaction = db.transaction(['transactions'], 'readwrite');

                    //Assign current store to variable
                    const currentStore = transaction.objectStore('transactions');

                    //Clear existing entries when bulk add successful
                    currentStore.clear();
                    console.log('Clearing store');
                }
            });
        };
    };
};

request.onsuccess = function (e) {
    console.log('success');
    db = e.target.result;

    //Checks if app is online before reading db
    if (navigator.onLine) {
        console.log('Backend online!');
        checkDatabase();
    }
};

const saveRecord = (record) => {
    console.log('Save record invoked');
    //Create transaction on db with read write access
    const transaction = db.transaction(['transaction'], 'readwrite');

    //Access transaction object store
    const store = transaction.objectStore('transaction');

    //Add record to store 
    store.add(record);
};

//Listen for app to come back online
window.addEventListener('online', checkDatabase);