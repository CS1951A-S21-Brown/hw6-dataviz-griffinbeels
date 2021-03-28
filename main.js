// Add your JavaScript code here
const MAX_WIDTH = Math.max(1080, window.innerWidth);
const MAX_HEIGHT = 720;
const margin = {top: 40, right: 100, bottom: 40, left: 300};
const NUM_GRAPH_1_ELEMENTS = 10;
const MAX_ENTRY_LENGTH = 22; // length of Star Wars Battlefront
const NUM_GRAPH_3_ELEMENTS = 15;
let padding = 15;

// Assumes the same graph width, height dimensions as the example dashboard. Feel free to change these if you'd like
let graph_1_width = document.getElementById("graph1").offsetWidth - padding, graph_1_height = 250;
let graph_2_width = document.getElementById("graph2").offsetWidth - padding, graph_2_height = 600;
let graph_3_width = document.getElementById("graph3").offsetWidth - padding, graph_3_height = 575;

// The radius of the pieplot is half the width or half the height (smallest one).
var radius = graph_2_height / 2 - margin.top - margin.bottom
var donutWidth = 75;
var legendRectSize = 19;
var legendSpacing = 4;
const REGIONS = ["NA", "EU", "JP", "Other", "Global"]

// CSV for the video game data
let FILENAME = "data/video_games.csv";

let graph1Vars = null;
let graph2Vars = null;
let graph3Vars = null;

data = null;

/**
 * Cleans the provided data using the given comparator then strips to first numExamples
 * instances
 */
 function cleanDataGraph1(data, comparator, year) {
    // Extract the data for the specific year
    let filtered_data = data.filter(a => a.Year == year)
    
    // Filter based on comparator, only return top NUM_GRAPH_1_ELEMENTS results
    return filtered_data.sort(comparator).slice(0, NUM_GRAPH_1_ELEMENTS) // extracts first n elements
}

function cleanDataGraph3(data, comparator){
    return [...data.entries()].sort(comparator).slice(0, NUM_GRAPH_3_ELEMENTS)
}

// 1. Your boss wants to know the top 10 for a specific year.
function buildGraph1(data){
    years = getAllUniqueValues(data, "Year")
    let g1Select = document.getElementById("g1year")
    let yearSelected = "";
    // Append the years to the graph drop down
    for (let i = 0; i < years.length; i++){
        let year = years[i];
        let yearOption = document.createElement("option")
        yearOption.textContent = `Year: ${year}`;
        yearOption.value = parseInt(year);
        if (graph1Vars && graph1Vars.yearSelected == year){ // select most recent
            yearOption.selected = 'selected'
            yearSelected = year;
        }else if (!graph1Vars && i == years.length - 1){ // select most recent
            yearOption.selected = 'selected'
            yearSelected = year;
        }
        g1Select.appendChild(yearOption);
    }

    let svg = d3.select("#graph1")
        .append("svg")
        .attr("width", graph_1_width)
        .attr("height", graph_1_height)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);
    
    let x = d3.scaleLinear()
    .range([0, graph_1_width - margin.left - margin.right]);

    // Create a scale band for the y axis (game title)
    let y = d3.scaleBand()
            .range([0, graph_1_height - margin.top - margin.bottom])
            .padding(0.1);  // Improves readability

    // Set up reference to count SVG group
    let countRef = svg.append("g");

    // Set up reference to y axis label to update text in setData
    let yAxisLabel = svg.append("g");

    // TODO: Add x-axis label
    svg.append("text")
    .attr("transform", `translate(${(graph_1_width - margin.left - margin.right) / 2},
    ${(graph_1_height - margin.top - margin.bottom) + 20})`)
    .style("text-anchor", "middle")
    .text("Global Sales (in Millions)");

    // TODO: Add y-axis label
    let yAxisText = svg.append("text")
    .attr("transform", `translate(${-225}, ${(graph_1_height - margin.top - margin.bottom) / 2})`) 
    .style("text-anchor", "middle")
    .text("Game (Platform)");

    // TODO: Add chart title
    let title = svg.append("text")
    .attr("transform", `translate(${(graph_1_width - margin.left - margin.right) / 2}, ${-10})`)       
    .style("text-anchor", "middle")
    .style("font-size", 15)

    // Colors
    let color = d3.scaleOrdinal()
                  .range(d3.quantize(
                      d3.interpolateHcl("#9146FF", "#6441A5"), NUM_GRAPH_1_ELEMENTS));

    graph1Vars = {
        "svg": svg,
        "x": x,
        "y": y,
        "countRef": countRef,
        "yAxisLabel": yAxisLabel,
        "title": title,
        "color": color
    };
    setGraph1Data(yearSelected)
    return graph1Vars;
}

function setGraph1Data(year){
    graph1Vars.yearSelected = year;
    // TODO: Clean and strip desired amount of data for barplot
    dataCleaned = cleanDataGraph1(data, function(a, b){
        return parseFloat(b.Global_Sales) - parseFloat(a.Global_Sales) // base 10, asc order
    }, year);

    // TODO: Update the x axis domain with the max count of the provided data
    graph1Vars.x.domain([0, d3.max(dataCleaned, function(d) { return parseFloat(d.Global_Sales); })]);
    graph1Vars.y.domain(dataCleaned.map(function(d){return getYDomain(d)}))
    graph1Vars.color.domain(dataCleaned.map(function(d){return getYDomain(d)}))

    graph1Vars.yAxisLabel.call(d3.axisLeft(graph1Vars.y).tickSize(0).tickPadding(5));

    let bars = graph1Vars.svg.selectAll("rect").data(dataCleaned);
    bars.enter()
        .append("rect")
        .merge(bars)
        .transition()
        .duration(1000)
        .attr("fill", function(d){ return graph1Vars.color(getYDomain(d))})
        .attr("x", graph1Vars.x(0))
        .attr("y", function(d){ return graph1Vars.y(getYDomain(d))})      
        .attr("width", function(d) { return graph1Vars.x(parseFloat(d.Global_Sales))})
        .attr("height",  graph1Vars.y.bandwidth());        // HINT: y.bandwidth() makes a reasonable display height
        
    let counts = graph1Vars.countRef.selectAll("text").data(dataCleaned);
    
    // TODO: Render the text elements on the DOM
    counts.enter()
        .append("text")
        .merge(counts)
        .transition()
        .duration(1000)
        .attr("x", function(d){
            return graph1Vars.x(parseFloat(d.Global_Sales)) + 10
        })       // HINT: Add a small offset to the right edge of the bar, found by x(d.count)
        .attr("y", function(d){
            return graph1Vars.y(getYDomain(d)) + 12
        })       // HINT: Add a small offset to the top edge of the bar, found by y(d.artist)
        .style("text-anchor", "start")
        .text(function(d){return d.Global_Sales});           // HINT: Get the count of the artist

    graph1Vars.title.text(`Top 10 Games in ${year}`);

    // Remove elements not in use if fewer groups in new dataset
    bars.exit().remove();
    counts.exit().remove();

    graph1Vars.bars = bars;
}

function getYDomain(d){
    let name = d.Name
    let subs = name.substring(0, MAX_ENTRY_LENGTH)
    if (subs.length < name.length){
        subs += "..."
    }
    return `${subs} (${d.Platform})`;
}

function getAllGenreDataForRegion(data){
    // For each game:
        // access map for {REGION -> {Genre -> Total}}
        // for each value in REGIONS
            // increment value by REGION_SALES
    
    let regionData = {}
    let regionTotals = {}
    for (let i = 0; i < REGIONS.length; i++){
        regionData[REGIONS[i] + "_Sales"] = {} // empty mapping for each region
        regionTotals[REGIONS[i] + "_Sales"] = 0; // 0 sales for region
    }

    // Add data per genre for each game
    for (let i = 0; i < data.length; i++){
        let gameData = data[i];
        let genre = gameData["Genre"];
        for (let i = 0; i < REGIONS.length; i++){
            let gameRegion = REGIONS[i] + "_Sales";
            let salesForRegion = parseFloat(gameData[gameRegion]);
            if (!regionData[gameRegion][genre]){ // no data exists yet for this genre in region
                regionData[gameRegion][genre] = salesForRegion;
            } else{
                regionData[gameRegion][genre] += salesForRegion;
            }
            regionTotals[gameRegion] += salesForRegion;
        }
    }

    return [regionData, regionTotals]
}

// 2. Your boss wants to understand which genre is most popular. 
// We'd like to see genre sales broken out per region. 
// (This question can be answered by showing the top genre
// in each region if you want to implement a map,
// otherwise you should show genre sales broken down by region in bar/scatter/line/pie etc.)
function buildGraph2(data){
    // Select options: NA, EU, JP, Other, Global
    // for each game's genre (e.g., sports), add to each of those totals
    // let's do a piechart
    // Followed this tutorial: https://www.d3-graph-gallery.com/graph/pie_changeData.html
    let res = getAllGenreDataForRegion(data)
    let regionData = res[0]
    let totalSales = res[1]

    let g2Select = document.getElementById("g2region")
    
    let regionSelected = "";

    // Append the regions to the graph drop down
    for (let i = 0; i < REGIONS.length; i++){
        let region = REGIONS[i];
        let regionOption = document.createElement("option");
        regionOption.textContent = `Region: ${region}`;
        regionOption.value = region + "_Sales";
        if (graph2Vars && graph2Vars.regionSelected == region + "_Sales"){ // account for resize
            console.log("HERE")
            regionOption.selected = 'selected'
            regionSelected = region + "_Sales";
        } else if (!graph2Vars && i == 0){ // select most recent
            regionOption.selected = 'selected'
            regionSelected = region + "_Sales";
        }
        g2Select.appendChild(regionOption);
    }

    let leftTranslation = (graph_2_width / 2)
    var svg = d3.select("#graph2")
        .append("svg")
        .attr("width", graph_2_width)
        .attr("height", graph_2_height)
        .append("g")
        .attr("transform", `translate(${leftTranslation}, ${graph_2_height / 2})`);

    // TODO: Add chart title
    let title = svg.append("text")
    .attr("transform", `translate(${0}, ${-graph_2_height/2.5})`)       
    .style("text-anchor", "middle")
    .style("font-size", 15)

    // also looked at the TA example for some help with how this would work START
    // Store tooltip in graph2vars, opacity 0 hidden by default
    let tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

    // Tooltip functionality https://www.d3-graph-gallery.com/graph/interactivity_tooltip.html
    let mouseover = function(d) {
        let percentOfTotal = (d.data.value / graph2Vars.totalSales[graph2Vars.regionSelected] * 100).toFixed(2);
        let html = `<strong>${d.data.key}</strong>
                    <br/> 
                    ${d.data.value.toFixed(2)} million sales
                    <br/>
                    ${percentOfTotal}% of total sales`;
        graph2Vars.tooltip.html(html)
            .style("top", `${(d3.event.pageY - 180)}px`) // mouse pos Y
            .style("left", `${(d3.event.pageX + 20)}px`) // mouse pos X
            .style("box-shadow", `1px 1px 10px ${graph2Vars.color(d.data.key)}`) // box shadow corresponding to the slice color
            .transition()
            .duration(150)
            .style("opacity", 1)
        d3.select(`#${d.data.key}`).attr('stroke', 'rgb(0, 0, 0)')
    };

    // Hide tooltip
    let mouseout = function(d) {
        graph2Vars.tooltip.transition()
            .duration(150)
            .style("opacity", 0);
        d3.select(`#${d.data.key}`).attr('stroke', 'rgb(255, 255, 255)');
    };
    // also looked at the TA example for some help with how this would work END

    graph2Vars = {
        "svg": svg,
        "title": title,
        "regionData": regionData,
        "totalSales": totalSales,
        "tooltip": tooltip,
        "mouseover": mouseover,
        "mouseout": mouseout
    };
    setGraph2Data(regionSelected)
    return graph2Vars;
}

function setGraph2Data(regionSelected){
    graph2Vars.regionSelected = regionSelected;
    // TODO: Update the x axis domain with the max count of the provided data
    // Compute the position of each group on the pie:
    var pie = d3.pie()
                .value(function(d) {return d.value; })
                .sort(function(a, b) { return d3.ascending(a.key, b.key);} ) // This make sure that group order remains the same in the pie chart
    
    var dataCleaned = pie(d3.entries(graph2Vars.regionData[regionSelected]))

    let genres = [];
    for(var k in graph2Vars.regionData[regionSelected]){
        genres.push(k)
    }
    graph2Vars.color = d3.scaleOrdinal()
    .domain(genres)
    .range(d3.schemePaired);

    let slices = graph2Vars.svg.selectAll("path").data(dataCleaned)
    let arcGenerator = d3.arc().innerRadius(radius - donutWidth).outerRadius(radius)
    slices
          .enter()
          .append("path")
          .on("mouseover", graph2Vars.mouseover)
          .on("mouseout", graph2Vars.mouseout)
          .merge(slices)
          .transition()
          .duration(500)
          .attr('d', arcGenerator)
          .attr('fill', function(d){return graph2Vars.color(d.data.key)})
          .attr("stroke", "white")
          .style('stroke-width', "2px")
          .style("opacity", 1)
          .attr('id', function(d){return d.data.key})


    // Stole this code for the legend from stackoverflow
    var legend = graph2Vars.svg.selectAll('.legend')
    .data(graph2Vars.color.domain())
    .enter()
    .append('g')
    .attr('class', 'legend')
    .attr('transform', function(d, i) {
        // if (graph_2_width < 600){
        //     legendRectSize = 10;
        //     legendSpacing = 2;
        // }
        var height = legendRectSize + legendSpacing;
        var offset =  height * graph2Vars.color.domain().length / 2;
        var horz = -2 * legendRectSize;
        var vert = i * height - offset;
        return 'translate(' + horz + ',' + vert + ')';
    });

    legend.append('rect')
        .attr('width', legendRectSize)
        .attr('height', legendRectSize)                                   
        .style('fill', graph2Vars.color)
        .style('stroke', "white");
        
    legend.append('text')
        .attr('x', legendRectSize + legendSpacing)
        .attr('y', legendRectSize - legendSpacing)
        .text(function(d) { return d; });
    // Stole above code from stackoverflow

    graph2Vars.title.text(`Genre Breakdown for ${regionSelected.replace("_Sales", "")}`);

    // // Remove elements not in use if fewer groups in new dataset
    slices.exit().remove();
    legend.exit().remove();
}

function getAllPublisherDataForGenre(data, genres){
    // For each game:
    // access map for {Genre -> {Publisher -> Total}}
        // for each value in REGIONS
        // increment value by REGION_SALES

    let genreData = {}
    for (let i = 0; i < genres.length; i++){
        genreData[genres[i]] = new Map()
    }

    // Add data per genre for each game
    for (let i = 0; i < data.length; i++){
        let gameData = data[i];
        let genre = gameData["Genre"];
        let publisher = gameData["Publisher"]
        let totalSales = parseFloat(gameData["Global_Sales"]);

        if (!genreData[genre].has(publisher)){ // no data exists yet for this genre & publisher
            genreData[genre].set(publisher, totalSales);
        } else{
            genreData[genre].set(publisher, genreData[genre].get(publisher) + totalSales);
        }
    }

    return genreData
}

// 3. Lastly, your boss wants to know which publisher to pick based on which genre a game is.
//  Your chart should provide a clear top publisher for each genre (could be interactive or statically show).
function buildGraph3(data){
    let genres = getAllUniqueValues(data, "Genre")
    let genreData = getAllPublisherDataForGenre(data, genres)

    // Select stuff
    let g3Select = document.getElementById("g3genre")
    let genreSelected = "";
    // Append the genres to the graph drop down
    for (let i = 0; i < genres.length; i++){
        let genre = genres[i];
        let genreOption = document.createElement("option")
        genreOption.textContent = `Genre: ${genre}`;
        genreOption.value = genre;
        if (graph3Vars && graph3Vars.genreSelected == genre){ // select most recent
            genreOption.selected = 'selected'
            genreSelected = genre;
        }else if (!graph3Vars && i == genres.length - 1){ // select most recent
            genreOption.selected = 'selected'
            genreSelected = genre;
        }
        g3Select.appendChild(genreOption);
    }

    let svg = d3.select("#graph3")
        .append("svg")
        .attr("width", graph_3_width)
        .attr("height", graph_3_height)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);
    
    let x = d3.scaleLinear()
    .range([0, graph_3_width - margin.left - margin.right]);

    // Create a scale band for the y axis (game title)
    let y = d3.scaleBand()
            .range([0, graph_3_height - margin.top - margin.bottom])
            .padding(0.1);  // Improves readability

    // Set up reference to count SVG group
    let countRef = svg.append("g");

    // Set up reference to y axis label to update text in setData
    let yAxisLabel = svg.append("g");

    // TODO: Add x-axis label
    svg.append("text")
    .attr("transform", `translate(${(graph_3_width - margin.left - margin.right) / 2},
    ${(graph_3_height - margin.top - margin.bottom) + 20})`)
    .style("text-anchor", "middle")
    .text("Global Sales (in Millions)");

    // TODO: Add y-axis label
    let yAxisText = svg.append("text")
    .attr("transform", `translate(${-225}, ${(graph_3_height - margin.top - margin.bottom) / 2})`) 
    .style("text-anchor", "middle")
    .text("Publisher");

    // TODO: Add chart title
    let title = svg.append("text")
    .attr("transform", `translate(${(graph_3_width - margin.left - margin.right) / 2}, ${-10})`)       
    .style("text-anchor", "middle")
    .style("font-size", 15)

    // Colors
    let color = d3.scaleOrdinal()
                  .range(d3.quantize(
                      d3.interpolateHcl("#9146FF", "#6441A5"), NUM_GRAPH_3_ELEMENTS));

    graph3Vars = {
        "svg": svg,
        "x": x,
        "y": y,
        "countRef": countRef,
        "yAxisLabel": yAxisLabel,
        "title": title,
        "color": color,
        "genreData": genreData,
        "genres": genres
    };
    setGraph3Data(genreSelected)
    return graph3Vars;
}

function setGraph3Data(genreSelected){
    graph3Vars.genreSelected = genreSelected;
    // TODO: Clean and strip desired amount of data for barplot
    let dataCleaned = cleanDataGraph3(graph3Vars.genreData[genreSelected], function(a, b){
        return b[1] - a[1] // base 10, asc order
    });

    console.log(dataCleaned)

    // TODO: Update the x axis domain with the max count of the provided data
    graph3Vars.x.domain([0, d3.max(dataCleaned, function(d) { return d[1]; })]);
    graph3Vars.y.domain(dataCleaned.map(function(d){return d[0]}))
    graph3Vars.color.domain(dataCleaned.map(function(d){return d[0]}))

    graph3Vars.yAxisLabel.call(d3.axisLeft(graph3Vars.y).tickSize(0).tickPadding(5));

    let bars = graph3Vars.svg.selectAll("rect").data(dataCleaned);
    bars.enter()
        .append("rect")
        .merge(bars)
        .transition()
        .duration(1000)
        .attr("fill", function(d){ return graph3Vars.color(d[0])})
        .attr("x", graph3Vars.x(0))
        .attr("y", function(d){ return graph3Vars.y(d[0])})      
        .attr("width", function(d) { return graph3Vars.x(d[1])})
        .attr("height",  graph3Vars.y.bandwidth());        // HINT: y.bandwidth() makes a reasonable display height
        
    let counts = graph3Vars.countRef.selectAll("text").data(dataCleaned);
    
    // TODO: Render the text elements on the DOM
    counts.enter()
        .append("text")
        .merge(counts)
        .transition()
        .duration(1000)
        .attr("x", function(d){
            return graph3Vars.x(parseFloat(d[1])) + 10
        })       // HINT: Add a small offset to the right edge of the bar, found by x(d.count)
        .attr("y", function(d){
            return graph3Vars.y(d[0]) + 12
        })       // HINT: Add a small offset to the top edge of the bar, found by y(d.artist)
        .style("text-anchor", "start")
        .text(function(d){return d[1].toFixed(2)});           // HINT: Get the count of the artist

    graph3Vars.title.text(`Top 15 Publishers for ${genreSelected} Games`);

    // Remove elements not in use if fewer groups in new dataset
    bars.exit().remove();
    counts.exit().remove();

    graph3Vars.bars = bars;
}

// What are all of the options for some column that are valid?
function getAllUniqueValues(data, columnName){
    // Get all values in our data
    let allValues = data.map(game => game[columnName]);

    // only unique values; convert back to array for filter + sort
    let uniqueValues = Array.from(new Set(allValues)).sort().reverse()

    // Filter out invalid entry
    uniqueValues = uniqueValues.filter(val => val != "N/A");
    return uniqueValues
}

function handleResize(){        
    document.getElementById("graph1").remove()
    document.getElementById("graph2").remove()
    document.getElementById("graph3").remove()
    document.getElementById("brg1g2").remove()
    document.getElementById("brg2g3").remove()
    document.getElementById("bottombr").remove()
    document.getElementById("c1").innerHTML += `
    <div id="graph1" class="graphbox">
        <!-- CITATION: Directly from Bootstrap's site -->
        <select id="g1year" class="form-select form-select-lg mb-3" size=5 aria-label=".form-select-lg example" onchange="setGraph1Data(this.value)">
        </select>
        </div>
        <br id="brg1g2"/>
        <div id="graph2" class="graphbox">
            <select id="g2region" class="form-select form-select-lg mb-3" size=5 aria-label=".form-select-lg example" onchange="setGraph2Data(this.value)">
            </select>
        </div>
        <br id="brg2g3"/>
    </div>
    `
    document.getElementById("c2").innerHTML += `
        <div id="graph3" class="graphbox">
            <select id="g3genre" class="form-select form-select-lg mb-3" size=5 aria-label=".form-select-lg example" onchange="setGraph3Data(this.value)">
            </select>
        </div>
        <br id="bottombr">
    `
    graph_1_width = document.getElementById("graph1").offsetWidth - padding, graph_1_height = 250;
    graph_2_width = document.getElementById("graph2").offsetWidth - padding, graph_2_height = 600;
    graph_3_width = document.getElementById("graph3").offsetWidth - padding, graph_3_height = 575;
    loadAllData(data)
}
window.addEventListener("resize", handleResize)

// Load the CSV file ONLY ONCE, and hydrate some data oh yeah
d3.csv(FILENAME).then(loadAllData)

function loadAllData(d){
    data = d;
    graph1Vars = buildGraph1(data)
    graph2Vars = buildGraph2(data)
    graph3Vars = buildGraph3(data)
}