queue()
    .defer(d3.csv, "data/flavors_of_cacao.csv")
    .await(makeGraphs);


function makeGraphs(error, cacaoData) {
    var ndx = crossfilter(cacaoData);

    cacaoData.forEach(function(d){
        d.Rating = parseInt(d.Rating);
        d.Company = parseInt(d.Company);
        d.Broad_Bean_Origin = parseInt(d["Broad.Bean.Origin"]);
    });

    show_cocoa_by_rating(ndx);
    show_average_rating_for_percent(ndx);
    show_most_used_bean(ndx);
    show_service_to_salary_correlation(ndx);
    // show_phd_to_salary_correlation(ndx);

    dc.renderAll();
}


function show_cocoa_by_rating(ndx) {
    var cocoaDim = ndx.dimension(dc.pluck("Rating"));
    var cocoaMix = cocoaDim.group();
    
    dc.barChart("#cocoa_by_rating")
        .width(600)
        .height(250)
        .margins({top: 10, right: 50, bottom: 30, left: 50})
        .dimension(cocoaDim)
        .group(cocoaMix)
        .transitionDuration(500)
        .x(d3.scale.ordinal())
        .xUnits(dc.units.ordinal)
        .elasticY(true)
        .xAxisLabel("Rating")
        .yAxis().ticks(10);
}


function show_average_rating_for_percent(ndx) {
    var cacaoDim = ndx.dimension(dc.pluck("Cocoa_Percent"));
    var averagePercentByRating = cacaoDim.group().reduce(
        function (p, v) {
            p.count++;
            p.total += v.Rating;
            return p;
        },
        function (p, v) {
            p.count--;
            if (p.count == 0) {
                p.total = 0;
            } else {
                p.total -= v.Rating;
            }
            return p;
        },
        function () {
            return {count: 0, total: 0};
        }
    );

    dc.barChart("#average_rating_for_percent")
        .width(1200)
        .height(250)
        .margins({top: 10, right: 50, bottom: 30, left: 50})
        .dimension(cacaoDim)
        .group(averagePercentByRating)
        .valueAccessor(function (d) {
            if (d.value.count == 0) {
                return 0;
            } else {
                return d.value.total / d.value.count;
            }
        })
        .transitionDuration(500)
        .x(d3.scale.ordinal())
        .xUnits(dc.units.ordinal)
        .elasticY(true)
        .xAxisLabel("Cocoa Percent")
        .yAxis().ticks(4);
}


function show_most_used_bean(ndx) {
    var cocoaDim = ndx.dimension(dc.pluck("Specific_Bean_Origin_or_Bar_Name"));
    var cocoaMix = cocoaDim.group();
    
    dc.rowChart("#most_used_bean")
            .dimension(cocoaDim)
            .group(cocoaMix)
            .width(600)
            .height(250)
			.gap(4)
          	.elasticX(false)
          	.ordering(function(d){ return -d.value })
            .cap(8)
          	.othersGrouper(false);
}


function show_service_to_salary_correlation(ndx) {

    var eDim = ndx.dimension(dc.pluck("Bean_Type"));
    var eGroup = eDim.group();

    dc.pieChart('#service-salary')
        .height(458)
        .radius(150)
        .externalLabels(50)
        .drawPaths(true)
        .transitionDuration(1500)
        .dimension(eDim)
        .group(eGroup)
        .legend(dc.legend());
}


function show_phd_to_salary_correlation(ndx) {
    var genderColors = d3.scale.ordinal()
        .domain(["Female", "Male"])
        .range(["pink", "blue"]);

    var pDim = ndx.dimension(dc.pluck("Company"));
    var phdDim = ndx.dimension(function(d){
        return [d.Company, d.Rating, d.rank, d.sex];
    });
    var phdSalaryGroup = phdDim.group();

    var minPhd = pDim.bottom(1)[0].Company;
    var maxPhd = pDim.top(1)[0].Company;

    dc.scatterPlot("#phd-salary")
        .width(800)
        .height(400)
        .x(d3.scale.linear().domain([minPhd,maxPhd]))
        .brushOn(false)
        .symbolSize(8)
        .clipPadding(10)
        .yAxisLabel("Salary")
        .xAxisLabel("Years Since PhD")
        .title(function (d) {
            return d.key[2] + " earned " + d.key[2];
        })
        .colorAccessor(function (d) {
            return d.key[3];
        })
        .colors(genderColors)
        .dimension(phdDim)
        .group(phdSalaryGroup)
        .margins({top: 10, right: 50, bottom: 75, left: 75});
}
