module.exports = function analyzeCode(code) 
{
  // This array stores all the issues we find each issues is an object  

  let issues = [];

  let lines = code.split('\n');

  // RULE 1 — UNUSED VARIABLES
  // Logic: Find every "let/const/var x" declaration.
  // Then count how many times that variable name appears in the whole code.
  // If it appears only 1 time (the declaration itself), it's unused.
    
  function findUnusedVariables(code, lines) {
    let found = [];

    lines.forEach((line, index) => {

      // Find variable declarations (let / const / var)
      let match = line.match(/\b(let|const|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/);
      // \b = word boundary means we match whole words not parts of words
      if (!match) return;

      let varName = match[2];
      let count = 0;

      // Now count how many times this name appears in the entire code
      lines.forEach(function(eachLine) {
        // We split by non-word characters so "x" doesn't match inside "index"
        let words = eachLine.split(/[^a-zA-Z0-9_$]/);
        words.forEach(function(word) {
          if (word === varName) {
            count = count + 1;
          }
        });
      });

      // If count is 1, the variable is only declared, never used
      if (count === 1) {
        found.push({
          line: index + 1,
          type: "Unused Variable",
          severity: "low",
          explanation: "You declared a variable called '" + varName + "' but you never use it anywhere in your code. This is just dead code sitting there doing nothing.",
          suggestion: "Either delete this line, or use '" + varName + "' somewhere in your code.",
          code: line.trim()
        });
      }
    });

    return found;
  }

  issues.push(...findUnusedVariables(code, lines)); // ... represents spreading the array into individaul items
  //Run the unused-variable rule, take all the problems it finds, and add them one by one to my main issues list

//RULE 2 — EXCESSIVE NESTING (too many if/for inside each other)
//Logic: Go line by line. Every "{" adds 1 to depth. Every "}" subtracts 1.
//If depth goes above 4, flag it  
function findExcessiveNesting(code, lines) {
   let found = [];
   let depth = 0;
   let alreadyFlagged = false; // so we don't flag every single lines

   lines.forEach(function(line, index) {
     // Count how many { and } are on this line
        let opens = (line.match(/{/g) || []).length;
        let closes = (line.match(/}/g) || []).length; // g = global and [] = null "if there is { then treat is as zero"
        depth = depth + opens;
        depth = depth - closes;
    // if depth is more than 4 and we haven't flagged this block yet
    if (depth > 4 && !alreadyFlagged) {
        alreadyFlagged = true;
        found.push({
            line : index +1,
            type: "Excessive Nesting",
        severity: "Warning",
        explanation: "Your code is nested " + depth + " levels deep here. That means you have code inside code inside code inside code. This makes it really hard to read and understand.",
        suggestion: "Try breaking the inner logic into a separate function, or use early returns to avoid deep nesting.",
        code: line.trim()
        });
    }
// Reset the flag when we come back to depth 4 or less
    if (depth <= 4) {
        alreadyFlagged = false;
    }});
    return found;
}
  issues.push(...findExcessiveNesting(code, lines));

// Rule 3 - MAGIC NUMBERS (random numbers in code without explanation)
//Logic: Look for numbers (bigger than 1) that appear in expressions.
//Skip lines that are declarations (const x = 5 is fine, that's naming it).
//Skip comment lines
//Any numeric literal ≥ 2 used directly in executable code should probably be replaced with a named constant (e.g., const MAX_Length = 99;)
function findMagicNumbers(code, lines) {
    let found = [];
    lines.forEach(function(line,index) {
        // skip lines that declare a variable 
        if (line.match(/\b(const|let|var)\s+/)) return;
        // skip comments
        if (line.trim().startsWith("//")) return;
        // skip empty lines
        if (line.trim()=="") return;
        // find numbers that are 2 or bigger (0 , 10 and 1 are commom so usually fine)
        let matches = line.match(/\b([2-9][0-9]*|[1-9][0-9]{2,})\b/g);
        // \b match whole no not part of variable eg "var10x" (a|b means a or b)
        if (matches) {
            let alreadyFlagged = false;// Only flag once per line so we don't spam
            matches.forEach(function(num) {
                found.push({
                  line: index + 1,
                  type: "Magic Number",
                  severity: "info",
                  explanation: "The number " + matches[0] + " appears directly in your code. Other people reading this won't know what it means. Why " + matches[0] + "? What does it represent?",
                  suggestion: "Create a named variable like 'const MAX_ITEMS = " + matches[0] + "' at the top and use that name instead.",
                  code: line.trim()
                });
            });
        }
    });
    return found;

}

   issues.push(...findMagicNumbers(code, lines));
return issues;
}
// End of Rules

//MAIN FUNCTION — runs all rules and collects results
function analyzeCode(code) {
    // Get the code the user typed
    let code = document.getElementById("codeInput").value;
    // if no code , exit
    if (code.trim() === "") {
        alert("Please enter some code to analyze.");
        return;
    }
    // split the code into individual lines
    let lines = code.split("\n");
    // reset everything
    issues = [];
    
    // run each rule
    let rule1 = findUnusedVariables(code, lines); 
    issues.push(...rule1);
    let rule2 = findExcessiveNesting(code, lines);
    issues.push(...rule2);
    let rule3 = findMagicNumbers(code, lines);
    issues.push(...rule3);

    // Combine all results into one array
    let allIssues = [...rule1, ...rule2, ...rule3];
    allIssues.sort((a, b) => a.line - b.line); // sort by line number so issues appear in order
    // Give each issue a unique ID and set status to pending
    allIssues.forEach(function(allIssue, index) {
    allIssue.id = index + 1;
    allIssue.status = "pending";
  });
   displayIssues(allIssues);
}
// DISPLAY — takes the issues array and puts them on the screen
function displayIssues() {
    let issuesList = document.getElementById("issuesList");
    let issuesSection = document.getElementById("issuesSection");
    let noIssues    = document.getElementById("noIssues");
    let reportSection = document.getElementById("reportSection");

    // clear old stuff
    issuesList.innerHTML = "";
    // if no issues found
    if (allIssues.length === 0) {
       issuesSection.classList.add("hidden");
       noIssues.classList.remove("hidden");
       reportSection.classList.add("hidden");
    return; 
    }
   // Show the issues section, hide the "no issues" message
    issuesSection.classList.remove("hidden");
    noIssues.classList.add("hidden");
    reportSection.classList.remove("hidden");
    //update the count batch
    document.getElementById("issueCount").textContent = allIssues.length;
    // Decide  DECIDE — updates the status of one issue
   // issueId = the issue number
  // choice  = "accepted" or "rejected"
  function decide(issueId, choice) {
  // Find the issue in tDhe array
  let issue = allIssues.find(function (item) {
    return item.id === issueId;
  });

  // If not found, stop
  if (!issue) return;

  // Update its status
  issue.status = choice;
}
// Get Stats - counts accepted, rejected, pending
// Returns an object with the three counts.
function getStats(){
  let accepted = 0;
  let rejected = 0;
  let pending  = 0;
  allIssues.forEach(function(issue){
    if (issue.status === "accepted") accepted++;
    if (issue.status === "rejected") rejected++;
    if (issue.status === "pending") pending++;

  });
   return {
    accepted: accepted,
    rejected: rejected,
    pending: pending
   };
}
// Generate Final Report
function generateReport() {
    let report = [];
    allIssues.forEach(function(issue) {
        report.push({
            line:  issue.line,
            type:  issue.type,
        })
    })
}
}


