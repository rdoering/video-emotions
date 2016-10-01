
/* change to http://localhost:8090/sessions */
var SESSIONS_ENDPOINT = "sessions-test.json";

var SCORE_TYPES = ["anger", "contempt", "disgust", "fear", "happiness", "neutral", "sadness", "surprise"];

function init(){
    d3.json(SESSIONS_ENDPOINT, function (error, data) {
        if (error)
            throw error;

        d3.select("#sessions").selectAll(".session").remove();
        appendSessionDivs(data.sessions);
    });
}

function appendSessionDivs(sessions) {
    var sessionDivs = d3.select("#sessions").selectAll(".session")
        .data(sessions).enter()
        .append("div")
        .classed("session", true);

    appendSessionHeadline(sessionDivs);
    appendSessionChart(sessionDivs);
}

function appendSessionHeadline(sessionDivs){
    sessionDivs.each(function(sessionData, i){
        var headlineP = d3.select(this).append("p").classed("headline", true);

        /* start time */
        var startAt = d3.min(sessionData.emotionSet, function(emotionSet){ return emotionSet.emotionsAt});
        var startAtAsDate = new Date(Date.parse(startAt));
        var startAtDateReadable = startAtAsDate.toDateString()
        var startAtTimeReadable = startAtAsDate.getHours()+":"+startAtAsDate.getMinutes();
        headlineP.append("span").classed("startAt", true).text(startAtDateReadable +" "+startAtTimeReadable);

        /* duration */
        var endAt = d3.max(sessionData.emotionSet, function(emotionSet){ return emotionSet.emotionsAt});
        var durationInMillis = new Date(endAt) - new Date(startAt);
        var durationInMinutes = Math.round(durationInMillis / 1000 / 60);
        headlineP.append("span").classed("duration", true).text(" ~"+durationInMinutes+ "min");
    })
}

function appendSessionChart(sessionDivs){
    console.log(sessionDivs);
    sessionDivs.each(function(sessionData, i){
        console.log("sessionData", sessionData);

        var svg = d3.select(this).append("svg").attr("width",900).attr("height",150);
        var margin = {top: 20, right: 80, bottom: 30, left: 50};
        var width = svg.attr("width") - margin.left - margin.right
        var height = svg.attr("height") - margin.top - margin.bottom
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

        console.log("after aggregateEmotions", sessionData.emotionSet);

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
