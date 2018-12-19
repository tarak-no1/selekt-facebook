/**
 * Created by samba on 25/04/17.
 */
let fs = require("fs");
const questions = JSON.parse(fs.readFileSync("./public/question_flow.json"));
const conversation_rules = JSON.parse(fs.readFileSync("./public/conversation_graph.json"));

module.exports = {
    questions : questions,
    conversation_rules : conversation_rules
}