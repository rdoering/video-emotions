
/* change to sessions-test.json if needed */
var SESSIONS_ENDPOINT = "http://localhost:8091/api/sessions";

var SCORE_TYPES = ["anger", "contempt", "disgust", "fear", "happiness", "neutral", "sadness", "surprise"];

var REFRESH_INTERVAL_IN_SECONDS = 5;

/**
 * re-init to update charts
 */
setInterval(init, REFRESH_INTERVAL_IN_SECONDS*1000);

/**
 * called via body-onload and interval
 */
function init(){
    d3.json(SESSIONS_ENDPOINT, function (error, sessionsResponse) {
        if (error){
            console.error("unable to reach "+SESSIONS_ENDPOINT+ " server started already?");
            throw error;
        }

        d3.select("#sessions").selectAll(".session").remove();
        appendSessionDivs(sessionsResponse.sessions);
    });
}

function appendSessionDivs(sessions) {
    var sessionDivs = d3.select("#sessions").selectAll(".session")
        .data(sessions).enter()
        .append("div")
        .classed("session", true);

    appendSessionHeadline(sessionDivs);
    appendBenchmark(sessionDivs);
    appendSessionChart(sessionDivs);
    appendLegend(sessionDivs);
}

function appendSessionHeadline(sessionDivs){
    sessionDivs.each(function(sessionData, i){
        var headlineP = d3.select(this).append("p").classed("headline", true);

        /* start time */
        var startAt = d3.min(sessionData.emotionSet, function(emotionSet){ return emotionSet.emotionsAt});
        var startAtAsDate = new Date(Date.parse(startAt));
        var startAtDateReadable = startAtAsDate.toDateString();
        var startAtTimeReadable = startAtAsDate.getHours()+":"+startAtAsDate.getMinutes();
        headlineP.append("span").classed("startAt", true).text(startAtDateReadable +" "+startAtTimeReadable);

        /* duration */
        var endAt = d3.max(sessionData.emotionSet, function(emotionSet){ return emotionSet.emotionsAt});
        var durationInMillis = new Date(endAt) - new Date(startAt);
        var durationInMinutes = Math.round(durationInMillis / 1000 / 60);
        headlineP.append("span").classed("duration", true).text(" ~"+durationInMinutes+ "min");
    })
}

function appendBenchmark(sessionDivs){
    sessionDivs.each(function(sessionData, i){
        var benchmarkIndex = calcBenchmarkIndex(sessionData, i);
        var benchmarkDiv = d3.select(this).append("div").classed("benchmark", true);

        benchmarkDiv.append("span")
            .classed("benchmarkIndex", true)
            .attr("title", "benchmark index: "+benchmarkIndex)
            .text(benchmarkIndex);

        benchmarkDiv.append("a")
            .attr("href", "#")
            .text("start analyzation");
    });
}

/**
 * dummy function - yet.
 * @returns {string}
 */
function calcBenchmarkIndex(sessionData, i){
    console.log("calcBenchmarkIndex", sessionData);
    /* plot benchmark here! (but maybe calculate somewhere else?) */
    var hash = text2hashcode(i+JSON.stringify(sessionData));
    var lastDigitOfHash = hash.toString().slice(-1); //should be a stable but random number between 0-9;
    return lastDigitOfHash;
}

function appendSessionChart(sessionDivs){
    sessionDivs.each(function(sessionData, i){

        var svg = d3.select(this).append("svg").attr("width",900).attr("height",150);
        var margin = {top: 20, right: 80, bottom: 30, left: 50};
        var width = svg.attr("width") - margin.left - margin.right;
        var height = svg.attr("height") - margin.top - margin.bottom;
        var g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        var x = d3.scaleTime().range([0, width]);
        var y = d3.scaleLinear().range([height, 0]);
        var z = d3.scaleOrdinal(d3.schemeCategory10);

        // TODO: improve!
        var angerLine = d3.line()
            .curve(d3.curveBasis)
            .x(function (d) {
                return x(Date.parse(d.emotionsAt));
            })
            .y(function (d) {
                return y(d.aggregatedEmotions.anger);
            });
        // TODO: improve!
        var contemptLine = d3.line()
            .curve(d3.curveBasis)
            .x(function (d) {
                return x(Date.parse(d.emotionsAt));
            })
            .y(function (d) {
                return y(d.aggregatedEmotions.contempt);
            });
        // TODO: improve!
        var disgustLine = d3.line()
            .curve(d3.curveBasis)
            .x(function (d) {
                return x(Date.parse(d.emotionsAt));
            })
            .y(function (d) {
                return y(d.aggregatedEmotions.disgust);
            });
        // TODO: improve!
        var fearLine = d3.line()
            .curve(d3.curveBasis)
            .x(function (d) {
                return x(Date.parse(d.emotionsAt));
            })
            .y(function (d) {
                return y(d.aggregatedEmotions.fear);
            });
        // TODO: improve!
        var happinessLine = d3.line()
            .curve(d3.curveBasis)
            .x(function (d) {
                return x(Date.parse(d.emotionsAt));
            })
            .y(function (d) {
                return y(d.aggregatedEmotions.happiness);
            });
        // TODO: improve!
        var neutralLine = d3.line()
            .curve(d3.curveBasis)
            .x(function (d) {
                return x(Date.parse(d.emotionsAt));
            })
            .y(function (d) {
                return y(d.aggregatedEmotions.neutral);
            });
        // TODO: improve!
        var sadnessLine = d3.line()
            .curve(d3.curveBasis)
            .x(function (d) {
                return x(Date.parse(d.emotionsAt));
            })
            .y(function (d) {
                return y(d.aggregatedEmotions.sadness);
            });
        // TODO: improve!
        var surpriseLine = d3.line()
            .curve(d3.curveBasis)
            .x(function (d) {
                return x(Date.parse(d.emotionsAt));
            })
            .y(function (d) {
                return y(d.aggregatedEmotions.surprise);
            });

        /* from now on: focus on aggregated emotions (sum of all people per time) */
        aggregateEmotions(sessionData.emotionSet);

        x.domain(d3.extent(sessionData.emotionSet, function (d) {
            return Date.parse(d.emotionsAt);
        }));

        y.domain([
            0,
            d3.max(sessionData.emotionSet, function(emotions){
                return d3.max(SCORE_TYPES, function(scoreType){
                    return emotions.aggregatedEmotions[scoreType];
                });
            })
        ]);

        z.domain(SCORE_TYPES);

        /* axes */
        g.append("g")
            .attr("class", "axis axis--x")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x));

        g.append("g")
            .attr("class", "axis axis--y")
            .call(d3.axisLeft(y))
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", "0.71em")
            .attr("fill", "#000")
            .text("intensity");

        SCORE_TYPES.forEach(function(scoreType){
            g.append("path")
                .classed(scoreType, true)
                .attr("d", function(){
                    switch(scoreType) {
                        case "anger": return angerLine(sessionData.emotionSet);
                        case "contempt": return contemptLine(sessionData.emotionSet);
                        case "disgust": return disgustLine(sessionData.emotionSet);
                        case "fear": return fearLine(sessionData.emotionSet);
                        case "happiness": return happinessLine(sessionData.emotionSet);
                        case "neutral": return neutralLine(sessionData.emotionSet);
                        case "sadness": return sadnessLine(sessionData.emotionSet);
                        case "surprise": return surpriseLine(sessionData.emotionSet);
                        default: throw "undefined scoreType "+scoreType;
                    }

                });
        });


    });
}

function appendLegend(sessionDivs){
    sessionDivs.each(function() {

        var width = 150;
        var height = 130;
        var legendBuffer = 10;

        var svg = d3.select(this)
            .append("svg")
            .attr("width",width)
            .attr("height",height+legendBuffer)
            .classed("legend", true);

        var lineLength = 20;
        var verticalOffset = (height)/(SCORE_TYPES.length+1);

        svg.append("text")
            .classed("legend", true)
            .attr("x", 0)
            .attr("y", legendBuffer+(verticalOffset/4))
            .style("font-size", verticalOffset+"px")
            .style("font-weight", "bold")
            .text("Legend");

        SCORE_TYPES.forEach(function (scoreType, i){
            var offset = (i+1)*verticalOffset;
            svg.append("line")
                .classed(scoreType, true)
                .attr("x1", 0)
                .attr("x2", lineLength)
                .attr("y1", legendBuffer+offset)
                .attr("y2", legendBuffer+offset);

            svg.append("text")
                .classed(scoreType, true)
                .attr("x", lineLength+5)
                .attr("y", legendBuffer+offset+(verticalOffset/4))
                .style("font-size", verticalOffset+"px")
                .text(scoreType);
        });

    });
}

function aggregateEmotions(emotionSets){
    emotionSets.forEach(function(emotionSet, i){
        emotionSet.aggregatedEmotions = {};
        SCORE_TYPES.forEach(function(scoreType){
            emotionSet.aggregatedEmotions[scoreType] = d3.sum(emotionSet.emotions, function(e){
                return e.scores[scoreType];
            });
        });
    });
}

/**
 * http://erlycoder.com/49/javascript-hash-functions-to-convert-string-into-integer-hash-
 * @param str
 * @returns {number}
 */
function text2hashcode(str){
    var hash = 0;
    if (str.length == 0) return hash;
    for (i = 0; i < str.length; i++) {
        char = str.charCodeAt(i);
        hash = ((hash<<5)-hash)+char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
}