require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const math = require('mathjs');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

// Store the results temporarily
let outputData = null;

// Function to parse input
const parseInput = (input) => {
  return input.split(',').map((value) => parseFloat(value.trim()));
};

// Function to calculate correlation and regression
const calculateCorrelationAndRegression = (xValues, yValues) => {
  const n = xValues.length;
  const sumX = math.sum(xValues);
  const sumY = math.sum(yValues);
  const sumX2 = math.sum(xValues.map(x => x * x));
  const sumY2 = math.sum(yValues.map(y => y * y));
  const sumXY = math.sum(xValues.map((x, i) => x * yValues[i]));

  // Calculate r (correlation coefficient)
  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  const r = numerator / denominator;

  // Calculate regression coefficients (slope and intercept)
  const b = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const a = (sumY - b * sumX) / n;

  const significance = Math.abs(r) >= 0.5
    ? "Significant: Regression can be performed."
    : "Not significant: Regression is not appropriate.";

  return { r, a, b, significance };
};

// Function to generate regression line values
const generateRegressionLine = (xValues, a, b) => {
  return xValues.map(x => a + b * x);
};

// Function to render output dynamically
const renderOutput = () => {
  if (!outputData) return '';

  const { r, a, b, significance, predictedY, specificX } = outputData;
  let outputHtml = `
    <div class="output">
        <p>Correlation coefficient (r): ${r.toFixed(2)}</p>
        <p>Significance: ${significance}</p>
        <p>Regression equation: y = ${a.toFixed(2)} + ${b.toFixed(2)}x</p>
  `;

  if (specificX) {
    outputHtml += `<p>For x = ${specificX}, Predicted y = ${predictedY.toFixed(2)}</p>`;
  }

  outputHtml += '</div>';
  return outputHtml;
};

// HTML, CSS, and JS embedded in index.js
app.get('/', (req, res) => {
  const graphData = outputData ? {
    xValues: outputData.xValues,
    yValues: outputData.yValues,
    regressionY: outputData.regressionY
  } : null;

  const correlationData = outputData ? {
    r: outputData.r
  } : null;

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Correlation and Regression Calculator</title>
        <link rel="icon" href="logo.png">
        <style>
            body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 20px;
                background-color: #f4f4f4;
                transition: background-color 0.3s ease;
            }
            h1 {
                text-align: center;
                margin-bottom: 30px;
            }
            .container {
                max-width: 1000px;
                margin: auto;
                padding: 20px;
                background-color: transparent;
                box-shadow: 0px 0px 15px rgba(0, 0, 0, 0.1);
                border-radius: 8px;
                transition: box-shadow 0.3s ease;
            }
            .container:hover {
                box-shadow: 0px 0px 25px rgba(0, 0, 0, 0.2);
            }
            label {
                font-weight: bold;
            }
            input, button {
                width: 100%;
                padding: 12px;
                margin: 10px 0;
                border-radius: 5px;
                border: 1px solid #ccc;
                transition: all 0.3s ease;
            }
            input:focus, button:hover {
                border-color: #007BFF;
                background-color: #f1f1f1;
                outline: none;
            }
            button {
                background-color: #007BFF;
                color: white;
                cursor: pointer;
            }
            button:hover {
                background-color: #0056b3;
            }
            .output {
                margin-top: 20px;
                padding: 15px;
                background-color: #f1f1f1;
                border-radius: 5px;
                box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
            }
            .graph-row {
                display: flex;
                flex-wrap: wrap;
                justify-content: space-between;
                margin-top: 20px;
            }
.graph-container {
    display: inline-block; /* Ensures the graphs are displayed horizontally */
    width: 150px;  /* Set a smaller fixed width */
    height: 150px; /* Set a smaller fixed height */
    margin-right: 10px;  /* Add space between the graphs */
}

@media (max-width: 768px) {
    .graph-container {
        width: 120px;  /* Adjust width for smaller screens */
        height: 120px; /* Adjust height for smaller screens */
    }
}


        </style>
    </head>
    <body>
        <div class="container">
            <h1>Correlation and Regression Calculator</h1>
            <form action="/calculate" method="POST">
                <label for="x_values">Enter x values (comma-separated):</label>
                <input type="text" id="x_values" name="x_values" required>
                
                <label for="y_values">Enter y values (comma-separated):</label>
                <input type="text" id="y_values" name="y_values" required>
                
                <label for="specific_x">Enter a specific x value to predict y (optional):</label>
                <input type="text" id="specific_x" name="specific_x">
                
                <button type="submit">Calculate</button>
            </form>
            ${renderOutput()}
            
            <!-- Dynamic Graph Rendering -->
            <div class="graph-row" id="graph-container"></div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <script>
            // Dynamically add the chart if there's data
            function renderGraph(xValues, yValues, regressionY) {
    const ctx = document.createElement('canvas');
    ctx.classList.add('graph-container');  // Use the graph-container class from CSS
    document.getElementById('graph-container').appendChild(ctx);

    new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Data Points',
                data: xValues.map((x, index) => ({ x, y: yValues[index] })),
                backgroundColor: 'blue',  
                borderColor: 'blue',
                pointRadius: 5,
                pointBackgroundColor: 'blue',
                borderWidth: 1,
                fill: false,
            }, {
                label: 'Regression Line',
                data: xValues.map((x, index) => ({ x, y: regressionY[index] })),
                backgroundColor: 'red',  
                borderColor: 'red',
                borderWidth: 2,
                fill: false,
                lineTension: 0,
                showLine: true,
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: { 
                    type: 'linear', 
                    position: 'bottom',
                    title: {
                        display: true,
                        text: 'X Values'
                    }
                },
                y: { 
                    type: 'linear',
                    title: {
                        display: true,
                        text: 'Y Values'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false,  // Hide legend to save space
                },
            },
            elements: {
                line: {
                    tension: 0
                }
            }
        }
    });
}


            function renderCorrelationBarChart(r) {
                const ctx = document.createElement('canvas');
                ctx.classList.add('graph-container');
                document.getElementById('graph-container').appendChild(ctx);

                new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: ['Correlation Coefficient (r)'],
                        datasets: [{
                            label: 'Correlation Strength',
                            data: [r],
                            backgroundColor: r > 0 ? 'green' : 'red',
                            borderColor: r > 0 ? 'green' : 'red',
                            borderWidth: 1,
                        }]
                    },
                    options: {
                        responsive: true,
                        scales: {
                            y: {
                                beginAtZero: true,
                                title: {
                                    display: true,
                                    text: 'Correlation Coefficient'
                                }
                            }
                        }
                    }
                });
            }

            function renderPieChart(r) {
                const ctx = document.createElement('canvas');
                ctx.classList.add('graph-container');
                document.getElementById('graph-container').appendChild(ctx);

                new Chart(ctx, {
                    type: 'pie',
                    data: {
                        labels: ['Positive Correlation', 'Negative Correlation'],
                        datasets: [{
                            data: [Math.abs(r), 1 - Math.abs(r)],
                            backgroundColor: ['#4CAF50', '#F44336'],
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: {
                                position: 'top',
                            },
                        },
                    }
                });
            }

            // Check if we have the graph data and render the graph
            ${graphData ? `renderGraph(${JSON.stringify(graphData.xValues)}, ${JSON.stringify(graphData.yValues)}, ${JSON.stringify(graphData.regressionY)});` : ''}
            ${correlationData ? `renderCorrelationBarChart(${correlationData.r});` : ''}
            ${correlationData ? `renderPieChart(${correlationData.r});` : ''}
        </script>
    </body>
    </html>
  `);
});

app.post('/calculate', (req, res) => {
  const xValues = parseInput(req.body.x_values);
  const yValues = parseInput(req.body.y_values);
  const specificX = req.body.specific_x ? parseFloat(req.body.specific_x) : null;

  const { r, a, b, significance } = calculateCorrelationAndRegression(xValues, yValues);
  const regressionY = generateRegressionLine(xValues, a, b);
  
  let predictedY = null;
  if (specificX !== null) {
    predictedY = a + b * specificX;
  }

  outputData = { 
    xValues, 
    yValues, 
    r, 
    a, 
    b, 
    significance, 
    regressionY, 
    specificX, 
    predictedY 
  };

  res.redirect('/');
});

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
