  // This array stores all the issues we find each issues is an object  

  let allIssues = [];

  // RULE 1 — UNUSED VARIABLES
  // Logic: Find every "let/const/var x" declaration.
  // Then count how many times that variable name appears in the whole code.
  // If it appears only 1 time (the declaration itself), it's unused.
    
  function findUnusedVariables(code, lines) {
    let found = [];

    lines.forEach(function(line, index) {

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
          severity: "warning",
          explanation: "You declared a variable called '" + varName + "' but you never use it anywhere in your code. This is just dead code sitting there doing nothing.",
          suggestion: "Either delete this line, or use '" + varName + "' somewhere in your code.",
          code: line.trim()
        });
      }
    });

    return found;
  }


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
            severity: "warning",
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
        if (line.trim()=== "") return;
        // find numbers that are 2 or bigger (0 , 10 and 1 are commom so usually fine)
        let matches = line.match(/\b([2-9][0-9]*|[1-9][0-9]{2,})\b/g);
        // \b match whole no not part of variable eg "var10x" (a|b means a or b)
        if (matches) {
            // Only flag once per line so we don't spam
                found.push({
                  line: index + 1,
                  type: "Magic Number",
                  severity: "info",
                  explanation: "The number " + matches[0] + " appears directly in your code. Other people reading this won't know what it means. Why " + matches[0] + "? What does it represent?",
                  suggestion: "Create a named variable like 'const MAX_ITEMS = " + matches[0] + "' at the top and use that name instead.",
                  code: line.trim()
                });
        }
    });
    return found;

}

// Rule 4 - OVERLY LONG FUNCTION
// Logic: Look for lines that start a function using the "function" keyword
// When we find one, we start counting lines going forward
// We track { and } to know when the function body ends (depth goes back to 0)
// If the total lines from start to end is more than 30, flag it
function findLongFunctions(code, lines) {
    let found = [];
    let i = 0;

    while (i < lines.length) {
        // Check if this line has a function declaration like "function myFunc("
        let funcMatch = lines[i].match(/function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/);

        if (funcMatch) {
            let funcName = funcMatch[1]; // this captures the function name
            let startLine = i;           // remember where the function started
            let depth = 0;               // this tracks how deep we are in braces
            let bodyStarted = false;     // becomes true once we see the first {
            let j = i;                   // j is our scanner, it moves forward line by line

            // scan forward from the function start to find where it ends
            while (j < lines.length) {
                let opens  = (lines[j].match(/{/g) || []).length;
                let closes = (lines[j].match(/}/g) || []).length;

                depth = depth + opens;
                depth = depth - closes;

                // once we see the first { we know the body has started
                if (opens > 0) bodyStarted = true;

                // when depth comes back to 0 and we already saw the body, function is done
                if (bodyStarted && depth === 0) {
                    let totalLines = j - startLine + 1; // total lines from start to end

                    // if the function is longer than 30 lines, flag it
                    if (totalLines > 30) {
                        found.push({
                            line: startLine + 1,
                            type: "Overly Long Function",
                            severity: "error",
                            explanation: "The function '" + funcName + "' is " + totalLines + " lines long. A function should do one small thing. Long functions are really hard to debug and test.",
                            suggestion: "Break '" + funcName + "' into smaller functions. Each one should do just one job.",
                            code: lines[startLine].trim()
                        });
                    }

                    i = j; // jump i to where the function ended so we don't scan inside it again
                    break;
                }
                j++;
            }
        }
        i++;
    }

    return found;
}

// End of Rules

//MAIN FUNCTION — runs all rules and collects results
function analyzeCode() {
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
    allIssues = [];
    
    // run each rule
    let rule1 = findUnusedVariables(code, lines); 
    let rule2 = findExcessiveNesting(code, lines);
    let rule3 = findMagicNumbers(code, lines);
    let rule4 = findLongFunctions(code, lines); 

    // Combine all results into one array
    allIssues = rule1.concat(rule2).concat(rule3).concat(rule4);
    allIssues.sort(function (a, b) {
    return a.line - b.line;
    });  // sort by line number so issues appear in order
    // Give each issue a unique ID and set status to pending
    allIssues.forEach(function(issue, index) {
    issue.id = index + 1;
    issue.status = "pending";
  });
   displayIssues();
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
    // Pick the right CSS class based on severity
  function getSevClass(severity) {
    if (severity === "error")   return "sev-error";
    if (severity === "warning") return "sev-warning";
    return "sev-info";
  }

  // Build one card for each issue
  allIssues.forEach(function (issue) {
    let card = document.createElement("div");
    card.className = "issue-card";
    card.id = "issue-card-" + issue.id;

    let sevClass = getSevClass(issue.severity);

    // This is the full card HTML including Accept and Reject buttons
    card.innerHTML =
      '<div class="issue-top">' +
        '<span class="issue-line">Line ' + issue.line + '</span>' +
        '<span class="issue-type">' + issue.type + '</span>' +
        '<span class="sev ' + sevClass + '">' + issue.severity + '</span>' +
      '</div>' +
      '<div class="issue-explanation">' + issue.explanation + '</div>' +
      '<div class="issue-code">' + escapeHtml(issue.code) + '</div>' +
      '<div class="suggestion-box"><span>💡 Suggestion:</span> ' + issue.suggestion + '</div>' +
      '<div class="action-row" id="actions-' + issue.id + '">' +
        '<button class="btn-accept" onclick="decide(' + issue.id + ', \'accepted\')">✓ Accept</button>' +
        '<button class="btn-reject" onclick="decide(' + issue.id + ', \'rejected\')">✗ Reject</button>' +
      '</div>';

    issuesList.appendChild(card);
  });

  // Update stats after displaying
  updateStats();
}

// DECIDE — called when human clicks Accept or Reject on a card.
// Updates the issue status and replaces buttons with a badge.
function decide(issueId, choice) {
  // Find the issue in the array
  let issue = allIssues.find(function (item) {
    return item.id === issueId;
  });

  if (!issue) return;

  // Update its status
  issue.status = choice;

  // Replace the Accept/Reject buttons with a decided badge
  let actionsDiv = document.getElementById("actions-" + issueId);
  let badgeClass = (choice === "accepted") ? "decided-accepted" : "decided-rejected";
  let badgeText  = (choice === "accepted") ? "✓ Accepted"       : "✗ Rejected";

  actionsDiv.innerHTML = '<span class="decided-badge ' + badgeClass + '">' + badgeText + '</span>';

  // Update the stats
  updateStats();
}
// UPDATE STATS — counts accepted, rejected, pending.
// Enables the report button only when zero issues are pending.
function updateStats() {
  let accepted = 0;
  let rejected = 0;
  let pending  = 0;

  allIssues.forEach(function (issue) {
    if (issue.status === "accepted") accepted++;
    if (issue.status === "rejected") rejected++;
    if (issue.status === "pending")  pending++;
  });

  document.getElementById("statAccepted").textContent = accepted;
  document.getElementById("statRejected").textContent = rejected;
  document.getElementById("statPending").textContent  = pending;

  // Enable report button only when nothing is pending
  let btn = document.getElementById("btnReport");
  if (pending === 0 && allIssues.length > 0) {
    btn.disabled = false;
    btn.textContent = "Generate Final Report";
  } else {
    btn.disabled = true;
    btn.textContent = "Generate Final Report (Review All Issues First)";
  }
}

// GENERATE REPORT — builds the final report table on the page.
// Called when human clicks the Generate Report button.
function generateReport() {
  let reportRows = document.getElementById("reportRows");
  reportRows.innerHTML = "";

  allIssues.forEach(function (issue) {
    let statusClass = (issue.status === "accepted") ? "decided-accepted" : "decided-rejected";
    let statusText  = (issue.status === "accepted") ? "✓ Accepted"       : "✗ Rejected";

    let sevClass = "sev-info";
    if (issue.severity === "error")   sevClass = "sev-error";
    if (issue.severity === "warning") sevClass = "sev-warning";

    let row = document.createElement("div");
    row.className = "report-row";

    row.innerHTML =
      '<div class="rl">' +
        '<strong>Line ' + issue.line + '</strong> — ' + issue.type +
        ' <span class="sev ' + sevClass + '">' + issue.severity + '</span>' +
      '</div>' +
      '<div class="rr">' +
        '<span class="decided-badge ' + statusClass + '">' + statusText + '</span>' +
      '</div>';

    reportRows.appendChild(row);
  });
}

// CLEAR — resets everything back to the start
function clearAll() {
  document.getElementById("codeInput").value = "";
  document.getElementById("issuesList").innerHTML = "";
  document.getElementById("issuesSection").classList.add("hidden");
  document.getElementById("noIssues").classList.add("hidden");
  document.getElementById("reportSection").classList.add("hidden");
  allIssues = [];
}

// HELPER — escapes HTML so pasted code doesn't break the page

function escapeHtml(text) {
  let div = document.createElement("div");
  div.appendChild(document.createTextNode(text));
  return div.innerHTML;
}
// End of web.js