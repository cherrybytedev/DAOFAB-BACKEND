const express = require("express");
const fs = require("fs");
const app = express();
const port = 3000;
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "x-www-form-urlencoded, Origin, X-Requested-With, Content-Type, Accept, Authorization, *"
  );
  // res.header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS, DELETE')
  if (req.method === "OPTIONS") {
    res.header(
      "Access-Control-Allow-Methods",
      "GET, PUT, POST, PATCH, DELETE, OPTIONS"
    );
    res.setHeader("Access-Control-Allow-Credentials", true);
    return res.status(200).json({});
  }
  next();
}); 

app.get("/parents", (req, res) => {
  // Read the Parent.json file
  const parentData = JSON.parse(fs.readFileSync("./Parent.json")).data;

  // Extract query parameters for pagination and sorting
  const { page = 1, pageSize = 2, sortBy = "id" } = req.query;

  // Sort the parentData array by the specified sortBy field
  parentData.sort((a, b) => (a[sortBy] > b[sortBy] ? 1 : -1));

  // Calculate the start and end indices for the current page
  const startIndex = (page - 1) * pageSize;
  const endIndex = page * pageSize;

  // Extract the relevant data for the current page
  const data = parentData.slice(startIndex, endIndex);

  // Calculate the total paid amount for each parent object by summing the paidAmount field in the corresponding child objects
  const paidAmounts = parentData.reduce((acc, parent) => {
    const childData = JSON.parse(fs.readFileSync("./Child.json")).data;
    const childAmounts = childData
      .filter((child) => child.parentId === parent.id)
      .map((child) => child.paidAmount);
    const totalPaidAmount = childAmounts.reduce((a, b) => a + b, 0);
    return { ...acc, [parent.id]: totalPaidAmount };
  }, {});

  // Map the parent data to the desired format
  const mappedData = data.map((parent) => ({
    id: parent.id,
    sender: parent.sender,
    receiver: parent.receiver,
    totalAmount: parent.totalAmount,
    totalPaidAmount: paidAmounts[parent.id] || 0,
  }));

  // Send the mapped data as a response
  res.send(mappedData);
});

// Define API endpoint to fetch child data for a given parent ID
app.get("/children/:parentId", (req, res) => {
  // Read the Child.json file
  const childData = JSON.parse(fs.readFileSync("./Child.json")).data;
  const parentData = JSON.parse(fs.readFileSync("./Parent.json")).data;

  // Extract the parentId parameter from the request URL
  const parentId = req.params.parentId;

  // Filter the child data to include only the objects with the specified parentId
  const filteredData = childData.filter(
    (element) => Number(element.parentId) === Number(parentId)
  );
  const parent = parentData.filter((element) => element.id == parentId);
  // Map the child data to the desired format
  const mappedData = filteredData.map((child) => ({
    id: child.id,
    sender: parent[0].sender,
    receiver: parent[0].receiver,
    totalAmount: parent[0].totalAmount,
    paidAmount: child.paidAmount,
  }));

  // Send the mapped data as a response
  res.send(mappedData);
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
