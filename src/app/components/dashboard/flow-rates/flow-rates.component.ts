import {AfterViewInit, Component, Inject, Input, NgZone, OnDestroy, OnInit, PLATFORM_ID} from '@angular/core';
import * as am5 from '@amcharts/amcharts5';
import * as am5xy from '@amcharts/amcharts5/xy';
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated';
import {isPlatformBrowser} from "@angular/common";
import {Subscription} from "rxjs";
import {UtilitiesService} from "../../services/utilities.service";
import {DataService} from "../../services/data.service";
import {TimeSeriesData} from "../../../classes/time-series-data";
@Component({
  selector: 'app-flow-rates',
  templateUrl: './flow-rates.component.html',
  styleUrls: ['./flow-rates.component.css']
})
export class FlowRatesComponent implements OnInit, AfterViewInit, OnDestroy {
  divName: string = ""
  private _linkID: string = ""

  @Input() set linkID(value: string) {
    this._linkID = value
    this.divName = "div" + this._linkID
    this.data.linkSubject[this._linkID].asObservable().subscribe((data: TimeSeriesData) => {
      this.addData(data)
    })
  }
  private root!: am5.Root;

  randomData!: any
  series1!: am5xy.LineSeries
  xAxis!: am5xy.DateAxis<am5xy.AxisRenderer>
  constructor(@Inject(PLATFORM_ID) private platformId: Object, private zone: NgZone, private utilities: UtilitiesService, private data: DataService) {

  }

  browserOnly(f: () => void) {
    if (isPlatformBrowser(this.platformId)) {
      this.zone.runOutsideAngular(() => {
        f();
      });
    }
  }

  ngOnInit(): void {
    // this.randomData = setInterval((n: number)=> {
    //   const randomNumber = this.utilities.randomIntFromInterval(10, 50)
    //   const newTime = am5.time.add(new Date(), "second", 1).getTime()
    //   this.data.linkSubject[this._linkID].next(new TimeSeriesData(randomNumber, newTime))
    // }, 5000)

  }

  addData(data?: TimeSeriesData) {
    if (this.series1) {
      if (data) {
        const lastValue = this.series1.dataItems[this.series1.dataItems.length -1].get("valueY")
        //const randomNumber = this.utilities.randomIntFromInterval(10, 50)
        //const newTime = am5.time.add(new Date(), "second", 1).getTime()
        const randomNumber = data.value
        const newTime = data.time
        if (this.series1.data.length >= 60) {
          this.series1.data.removeIndex(0)
          this.series1.data.push({
            date: newTime,
            value: randomNumber
          })
        } else {
          this.series1.data.push({
            date: newTime,
            value: randomNumber
          })
        }
        let newDataItem = this.series1.dataItems[this.series1.dataItems.length -1]
        newDataItem.animate({
          key: "valueYWorking",
          to: randomNumber,
          from: lastValue,
          duration: 600,
          easing: am5.ease.linear
        })
        const animation = newDataItem.animate({
          key: "locationX",
          to: 0.5,
          from: -0.5,
          duration: 600
        })
        if (animation) {
          const tooltip = this.xAxis.get("tooltip")
          if (tooltip && !tooltip.isHidden()) {
            animation.events.on("stopped", () => {
              this.xAxis.updateTooltip()
            })
          }
        }
      }

    }
  }

  ngAfterViewInit() {
    this.browserOnly(() => {
      let root = am5.Root.new(this.divName);

      root.setThemes([am5themes_Animated.new(root)]);

      let chart = root.container.children.push(
        am5xy.XYChart.new(root, {
          panY: false,
          wheelY: "zoomX",
          layout: root.verticalLayout
        })
      );

      // Define data
      let data = [
        {
          date: new Date().getTime(),
          value: 10
        },
        {
          date: new Date().getTime(),
          value: 20
        },
        {
          date: new Date().getTime(),
          value: 40
        }
      ];

      // Create Y-axis
      let yAxis = chart.yAxes.push(
        am5xy.ValueAxis.new(root, {
          renderer: am5xy.AxisRendererY.new(root, {})
        })
      );

      // Create X-Axis
      this.xAxis = chart.xAxes.push(
        am5xy.DateAxis.new(root, {
          baseInterval: { timeUnit: "second", count: 1},
          renderer: am5xy.AxisRendererX.new(root, {}),
        })
      );
      this.xAxis.data.setAll(data);

      // Create series
      this.series1 = chart.series.push(
        am5xy.LineSeries.new(root, {
          name: "Flow rates",
          xAxis: this.xAxis,
          yAxis: yAxis,
          valueYField: "value",
          valueXField: "date",
          tooltip: am5.Tooltip.new(root, {
            pointerOrientation: "horizontal",
            labelText: "{valueY}"
          }),
          connect: true
        })
      );
      this.series1.data.setAll(data);

      // Add legend
      let legend = chart.children.push(am5.Legend.new(root, {}));
      legend.data.setAll(chart.series.values);

      // Add cursor
      chart.set("cursor", am5xy.XYCursor.new(root, {}));

      this.root = root;
    });
  }

  ngOnDestroy() {
    // Clean up chart when the component is removed
    this.browserOnly(() => {
      if (this.root) {
        this.root.dispose();
      }
      if (this.randomData) {
        clearInterval(this.randomData)
      }
    });
  }
}
