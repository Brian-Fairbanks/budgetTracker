let transactions = [];
let myChart;

fetch("/api/transaction")
  .then(response => {
    return response.json();
  })
  .then(async function(data) {
    // save db data on global variable
    transactions = data;

    // add data from localdb if it exists
    let localdata = await getLocalRecords() || [];
    // if it exists, also try to add it to ther server
    if(localdata.length > 0 ){
      tryAddLocal(localdata);
    }

    //update the global transactions with local data
    transactions = [...localdata.reverse() ,...transactions];

    populateTotal();
    populateTable();
    populateChart();
  });

function populateTotal() {
  // reduce transaction amounts to a single total value
  let total = transactions.reduce((total, t) => {
    return total + parseInt(t.value);
  }, 0);

  let totalEl = document.querySelector("#total");
  totalEl.textContent = total;
}

function populateTable() {
  let tbody = document.querySelector("#tbody");
  tbody.innerHTML = "";

  transactions.forEach(transaction => {
    // create and populate a table row
    let tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${transaction.name}</td>
      <td>${transaction.value}</td>
    `;

    tbody.appendChild(tr);
  });
}

function populateChart() {
  // copy array and reverse it
  let reversed = transactions.slice().reverse();
  let sum = 0;

  // create date labels for chart
  let labels = reversed.map(t => {
    let date = new Date(t.date);
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  });

  // create incremental values for chart
  let data = reversed.map(t => {
    sum += parseInt(t.value);
    return sum;
  });

  // remove old chart if it exists
  if (myChart) {
    myChart.destroy();
  }

  let ctx = document.getElementById("myChart").getContext("2d");

  myChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: "Total Over Time",
        fill: true,
        backgroundColor: "#6666ff",
        data
      }]
    }
  });
}

function sendTransaction(isAdding) {
  let nameEl = document.querySelector("#t-name");
  let amountEl = document.querySelector("#t-amount");
  let errorEl = document.querySelector(".form .error");

  // validate form
  if (nameEl.value === "" || amountEl.value === "") {
    errorEl.textContent = "Missing Information";
    return;
  }
  else {
    errorEl.textContent = "";
  }

  // create record
  let transaction = {
    name: nameEl.value,
    value: amountEl.value,
    date: new Date().toISOString()
  };

  // if subtracting funds, convert amount to negative number
  if (!isAdding) {
    transaction.value *= -1;
  }

  // add to beginning of current array of data
  transactions.unshift(transaction);

  // re-run logic to populate ui with new record
  populateChart();
  populateTable();
  populateTotal();

  // also send to server
  fetch("/api/transaction", {
    method: "POST",
    body: JSON.stringify(transaction),
    headers: {
      Accept: "application/json, text/plain, */*",
      "Content-Type": "application/json"
    }
  })
    .then(response => {
      return response.json();
    })
    .then(data => {
      if (data.errors) {
        errorEl.textContent = "Missing Information";
      }
      else {
        // clear form
        nameEl.value = "";
        amountEl.value = "";
      }
    })
    .catch(err => {
      // fetch failed, so save in indexed db
      saveRecord(transaction);

      // clear form
      nameEl.value = "";
      amountEl.value = "";
    });
}

document.querySelector("#add-btn").onclick = function () {
  sendTransaction(true);
};

document.querySelector("#sub-btn").onclick = function () {
  sendTransaction(false);
};


function saveRecord(postData) {
  console.log("Saving record to DB - " + JSON.stringify(postData));

  const request = window.indexedDB.open("savedPosts", 1);

  // Create schema
  request.onupgradeneeded = event => {
    const db = event.target.result;

    // Creates an object store with a listID keypath that can be used to query on.
    const savedPostsStore = db.createObjectStore("savedPosts", { keyPath: "time" });
    // Creates a statusIndex that we can query on.
    savedPostsStore.createIndex("time", "body");
  }

  request.onsuccess = () => {
    const db = request.result;
    const transaction = db.transaction(["savedPosts"], "readwrite");
    const savedPostsStore = transaction.objectStore("savedPosts");
    //const timeIndex = savedPostsStore.index("time");

    // Adds data to our objectStore
    savedPostsStore.add({ time: postData.date, body: postData });
  }
}

function getLocalRecords() {
  return new Promise(function(resolve, reject){
    const localPosts = []
    const request = window.indexedDB.open("savedPosts", 1);

    request.onupgradeneeded = event => {
      const db = event.target.result;
  
      // Creates an object store with a listID keypath that can be used to query on.
      const savedPostsStore = db.createObjectStore("savedPosts", { keyPath: "time" });
      // Creates a statusIndex that we can query on.
      savedPostsStore.createIndex("time", "body");
    }

    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(["savedPosts"], "readwrite");
      const savedPostsStore = transaction.objectStore("savedPosts");
      //const timeIndex = savedPostsStore.index("time");

      const getStoredPosts = savedPostsStore.getAll();

      getStoredPosts.onsuccess = () => {
        // console.log(getStoredPosts.result)
        for (post of getStoredPosts.result){
          localPosts.push(post.body);
        }

        resolve(localPosts);
        return;
      };
    }
  });
}

function tryAddLocal(localdata){
  try{
    fetch("/api/transaction/bulk", {
      method: "POST",
      body: JSON.stringify(localdata),
      headers: {
        Accept: "application/json, text/plain, */*",
        "Content-Type": "application/json"
      }
    }).then(function (data){
      console.log("Local posts successfully added to database!");

      const request = window.indexedDB.open("savedPosts", 1);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(["savedPosts"], "readwrite");
        const savedPostsStore = transaction.objectStore("savedPosts");
        savedPostsStore.clear();
        console.log("Local Database Cleared");
      }
    })
  }catch(err){
    console.log("Still no internet connection, but your local data has been added to the graph.");
  }
}
