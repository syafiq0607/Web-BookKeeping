const requestHandler = require("../server");

module.exports = async function apiHandler(req, res) {
  await requestHandler(req, res);
};
