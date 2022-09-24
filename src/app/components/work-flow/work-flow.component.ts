import {
  AfterContentInit,
  AfterViewInit,
  ChangeDetectorRef,
  Component, ElementRef,
  EventEmitter, OnDestroy,
  OnInit,
  Output,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import * as go from "gojs";
import { DataSyncService, DiagramComponent, PaletteComponent } from 'gojs-angular';
import {Subject} from "rxjs";
import {AnimationServiceService} from "../services/animation-service.service";
import {DiagramEvent, GraphObject} from "gojs";
import produce from "immer";
import {WebService} from "../services/web.service";
import {DataService} from "../services/data.service";
import {TimeSeriesData} from "../../classes/time-series-data";

@Component({
  selector: 'app-work-flow',
  templateUrl: './work-flow.component.html',
  styleUrls: ['./work-flow.component.css'],
  encapsulation: ViewEncapsulation.Emulated
})
export class WorkFlowComponent implements OnInit, AfterViewInit, AfterContentInit, OnDestroy {
  @ViewChild('workflow', { static: true }) workflow: DiagramComponent | undefined;
  @ViewChild('palette', { static: true }) palette: PaletteComponent | undefined;
  @Output() diagram: EventEmitter<any> = new EventEmitter<any>()
  cxElement = document.getElementById("contextMenu")
  animations: any = {};
  factory = go.GraphObject.make;
  linkMap: any = {}
  mapNode: any = {}
  linkDataSubscription: any = {}
  hideCX() {
    if (this.workflow?.diagram.currentTool instanceof go.ContextMenuTool) {
      this.workflow?.diagram.currentTool.doCancel()
    }
  }
  contextedObject: any = {};
  showContextMenu(obj: go.GraphObject, diagram: go.Diagram, tool: go.ContextMenuTool) {
    if (this.cxElement) {
      const cmd = diagram.commandHandler

      let hasMenuItem = false
      if (obj) {
        // @ts-ignore
        const node = diagram.findNodeForKey(obj.part.data.key)

        this.contextedObject = node

        const linkIncoming = node?.findLinksInto()
        let incomingCount = linkIncoming?.count
        const linkOutgoing = node?.findLinksOutOf()
        let outgoingCount = linkOutgoing?.count
        const maybeShowItem = (elt: any, pred: any) => {
          if (pred) {

            elt.style.display = "block"
            hasMenuItem = true
          } else {
            elt.style.display = "none"
          }
        }
        // @ts-ignore
        if (outgoingCount > 0) {
          maybeShowItem(document.getElementById("toggleOutgoing"), true);
          maybeShowItem(document.getElementById("toggleOutgoingAll"), true)

        } else {
          maybeShowItem(document.getElementById("toggleOutgoing"), null);
        }
        // @ts-ignore
        if (incomingCount > 0) {
          maybeShowItem(document.getElementById("toggleIncoming"), true);
          maybeShowItem(document.getElementById("toggleIncomingAll"), true);
        } else {
          maybeShowItem(document.getElementById("toggleIncoming"), null);
        }
        // maybeShowItem(document.getElementById("cut"), cmd.canCutSelection());
        // maybeShowItem(document.getElementById("copy"), cmd.canCopySelection());
        // maybeShowItem(document.getElementById("paste"), cmd.canPasteSelection(diagram.toolManager.contextMenuTool.mouseDownPoint));
        // maybeShowItem(document.getElementById("delete"), cmd.canDeleteSelection());
        // maybeShowItem(document.getElementById("color"), obj !== null);
        if (hasMenuItem) {

          this.cxElement.classList.add("show-menu");
          const mousePt = diagram.lastInput.viewPoint;
          const offsetLeft = document.getElementById("diagramStuff")?.offsetLeft
          const offsetTop = document.getElementById("diagramStuff")?.offsetTop

          if (offsetLeft && offsetTop) {
            this.cxElement.style.left = mousePt.x + 5 + offsetLeft + "px";
            this.cxElement.style.top = mousePt.y + offsetTop + "px";
          }

          window.addEventListener("pointerdown", this.hideCX, true)
        }
      }


    }
  }

  hideContextMenu() {
    this.cxElement?.classList.remove("show-menu")
    window.removeEventListener("pointerdown", this.hideCX, true)
  }

  diagramNodeData = [
    {key: "Chemical1", name: "Chemical 1", category: "Chemical", text: "", color: "#874C62"},
    {key: "Chemical2", name: "Chemical 2", category: "Chemical", text: "", color: "#874C62"},
    {key: "Chemical3", name: "Chemical 3", category: "Chemical", text: "", color: "#874C62"},
    {key: "Chemical4", name: "Chemical 4", category: "Chemical", text: "", color: "#874C62"},
    {key: "Chemical5", name: "Chemical 5", category: "Chemical", text: "", color: "#874C62"},
    {key: "Chemical6", name: "Chemical 6", category: "Chemical", text: "", color: "#874C62"},
    {key: "Chemical7", name: "Chemical 7", category: "Chemical", text: "", color: "#874C62"},
    {key: "Chemical8", name: "Chemical 8", category: "Chemical", text: "", color: "#874C62"},
    {key: "Valve1", name: "Valve 1", category: "Valve", text: "", color: "#A7D2CB"},
    {key: "Valve2", name: "Valve 2", category: "Valve", text: "", color: "#A7D2CB"}
  ]

  diagramLinkData = [
    {key: -1, from: "Chemical1", to: "Valve1", status: false, text: ""},
    {key: -2, from: "Chemical2", to: "Valve1", status: false, text: ""},
    {key: -3, from: "Chemical3", to: "Valve1", status: false, text: ""},
    {key: -4, from: "Chemical4", to: "Valve1", status: false, text: ""},
    {key: -5, from: "Chemical5", to: "Valve1", status: false, text: ""},
    {key: -6, from: "Chemical6", to: "Valve1", status: false, text: ""},
    {key: -7, from: "Chemical7", to: "Valve1", status: false, text: ""},
    {key: -8, from: "Chemical8", to: "Valve1", status: false, text: ""}
  ]

  paletteNodeData = [
    {key: "Chemical", name: "Chemical", text: "", color: "#874C62"},
    {key: "Valve", name: "Valve", text: "", color: "#A7D2CB"}
  ]

  state = {
    diagramModelData: { prop: 'value' },
    skipsDiagramUpdate: false,
    diagramNodeData: this.diagramNodeData,
    diagramLinkData: this.diagramLinkData,
    paletteNodeData: this.paletteNodeData
  }

  diagramDivClassName: string = "workFlowDiagramDiv"
  paletteDivClassName: string = "paletteDiv"
  dia: go.Diagram | undefined
  finishedTrigger: Subject<boolean> = new Subject<boolean>()
  toggleLinkAnimation (x: go.Link) {
    if (x.key) {
      if (this.animations[x.key]) {
        x.data.status = !x.data.status
        if (this.animations[x.key].status) {
          this.animations[x.key].status = false
          this.animations[x.key].animation.stop()
        } else {
          this.animations[x.key].status = true
          this.animations[x.key].animation.start()
        }
      }
    }
  }
  public initLinkAnimation(e: DiagramEvent) {
    //dia.startTransaction("add animation");
    const self = this
    const dia = this.dia
    if (dia) {
      dia.links.each(link => {
        const animation = new go.Animation()
        animation.easing = go.Animation.EaseLinear
        const pipe = link.findObject("PIPE")
        if (pipe) {
          animation.add(pipe, "strokeDashOffset", 20, 0)
        }
        animation.runCount = Infinity

        if (link.key) {
          if (typeof link.key === "number") {
            // @ts-ignore
            self.animations[link.key.toString()] = {status: false, animation: animation}
          } else {
            // @ts-ignore
            self.animations[link.key] = {status: false, animation: animation}
          }
        }
      })
      self.finishedTrigger.next(true)
    }
  }

  linkDrawn(e: DiagramEvent) {
    console.log("drawn")
    const animation = new go.Animation()
    animation.easing = go.Animation.EaseLinear
    const pipe = e.subject.findObject("PIPE")
    if (pipe) {
      animation.add(pipe, "strokeDashOffset", 20, 0)
    }
    animation.runCount = Infinity
    if (!(e.subject.data.from in this.linkMap)) {
      this.linkMap[e.subject.data.from] = {outgoing: [], incoming: []}
    }
    if (!(e.subject.data.to in this.linkMap)) {
      this.linkMap[e.subject.data.to] = {outgoing: [], incoming: []}
    }
    this.linkMap[e.subject.data.from].outgoing.push({key: e.subject.key, name: e.subject.data.to})
    this.linkMap[e.subject.data.to].incoming.push({key: e.subject.key, name: e.subject.data.from})
    if (typeof e.subject.data.key === "number") {
      // @ts-ignore
      this.animations[e.subject.data.key.toString()] = {status: false, animation: animation}
    } else {
      // @ts-ignore
      this.animations[e.subject.data.key] = {status: false, animation: animation}
    }
  }

  constructor(private cdr: ChangeDetectorRef, private animationSevice: AnimationServiceService, private web: WebService, private data: DataService) {
    this.finishedTrigger.asObservable().subscribe(trigger => {
      if (trigger) {
        console.log(trigger)
      }
    })
    //this.workflow?.diagram.addDiagramListener("InitialLayoutCompleted", e => this.initLinkAnimation(e))

  }

  ngOnInit(): void {
    this.animations = {}
  }

  initDiagram(): go.Diagram {
    const factory = go.GraphObject.make;
    const dia = factory(go.Diagram, {
      "animationManager.isEnabled": true,
      "animationManager.isInitial": true,
      "undoManager.isEnabled": true,
      "draggingTool.dragsLink": true,
      "draggingTool.isGridSnapEnabled": true,
      "linkingTool.isUnconnectedLinkValid": true,
      "linkingTool.portGravity": 20,
      "rotatingTool.handleAngle": 270,
      "rotatingTool.handleDistance": 30,
      "rotatingTool.snapAngleMultiple": 15,
      "rotatingTool.snapAngleEpsilon": 15,
      "grid.gridCellSize": new go.Size(30, 20),
      "resizingTool.isGridSnapEnabled": true,
      "grid.visible": true,
      // "relinkingTool.fromHandleArchetype":
      //   factory(go.Shape, "Diamond", { segmentIndex: 0, cursor: "pointer", desiredSize: new go.Size(8, 8), fill: "tomato", stroke: "darkred" }),
      // "relinkingTool.toHandleArchetype":
      //   factory(go.Shape, "Diamond", { segmentIndex: -1, cursor: "pointer", desiredSize: new go.Size(8, 8), fill: "darkred", stroke: "tomato" }),
      // "linkReshapingTool.handleArchetype":
      //   factory(go.Shape, "Diamond", { desiredSize: new go.Size(7, 7), fill: "lightblue", stroke: "deepskyblue" }),
      model: new go.GraphLinksModel(
        {
          nodeKeyProperty: "key",
          linkKeyProperty: "key"
        }
      )
    })

    const makePort = function (id: string, spot: go.Spot) {
      return factory(go.Shape, "Circle", {
        opacity: 0.5,
        fill: "gray", strokeWidth: 0, desiredSize: new go.Size(8, 8),
        portId: id, alignment: spot,
        fromLinkable: true, toLinkable: true
      })
    }
    dia.nodeTemplate = factory(go.Node, "Auto",
      factory(go.Shape, "RoundedRectangle", {stroke: null}, new go.Binding("fill", "color")),
      factory(go.TextBlock, {margin:8, editable: true}, new go.Binding("text", "name").makeTwoWay()),
      makePort('t', go.Spot.TopCenter),
      makePort('l', go.Spot.Left),
      makePort('r', go.Spot.Right),
      makePort('b', go.Spot.BottomCenter),
      {
        contextMenu:
        factory("ContextMenu",
            factory("ContextMenuButton",
              factory(go.TextBlock, "Toggle On/Off"),
              {click: (e, o) => {

                }}
            )
          )
        }
      )

    dia.linkTemplate = factory(go.Link,
      {routing: go.Link.AvoidsNodes, curve: go.Link.JumpGap, corner: 10, reshapable: true, toShortLength: 7},
      new go.Binding("points").makeTwoWay(),

      factory(go.Shape, { isPanelMain: true, stroke: "black", strokeWidth: 7 }),
      factory(go.Shape, { isPanelMain: true, stroke: "gray", strokeWidth: 5 }),
      factory(go.Shape, { isPanelMain: true, stroke: "white", strokeWidth: 3, name: "PIPE", strokeDashArray: [10, 10] }),
      factory(go.Shape, { toArrow: "Triangle", scale: 1.3, fill: "gray", stroke: null }),
      factory(go.Panel, "Auto",
        factory(go.Shape, "RoundedRectangle", {fill: "lightgray"}),
        factory(go.TextBlock, {font: "bold 10pt serif"}, new go.Binding("text", "text").makeTwoWay())
        )


    )

    this.dia = dia
    return dia
  }

  diagramModelChange(changes: go.IncrementalData) {
    console.log(changes)
    if (this.workflow) {
      console.log(this.animations)
      // @ts-ignore
      this.diagram.emit({nodes: this.workflow.diagram.model.nodeDataArray, links: this.workflow.diagram.model.linkDataArray, diagram: this.workflow.diagram})
    }

  }

  initPalette(): go.Palette {
    const factory = go.GraphObject.make
    const palette = factory(go.Palette)
    palette.nodeTemplate = factory(go.Node, "Auto",
      factory(go.Shape, "RoundedRectangle", {stroke: null}, new go.Binding("fill", "color")),
      factory(go.TextBlock, {margin:8}, new go.Binding("text", "name"))
    )
    palette.model = new go.GraphLinksModel(
      {
        linkKeyProperty: 'key'
      }
    )
    return palette
  }

  ngAfterViewInit() {

  }

  ngAfterContentInit() {
    this.cxElement = document.getElementById("contextMenu")
    let completeInitial = false
    if (this.cxElement) {
      this.cxElement.addEventListener("contextmenu", (e: Event) => {
        e.preventDefault()
        return false
      }, false)
    }
    const watchGoJS = setInterval(() => {
      if (this.workflow?.diagram) {
        clearInterval(watchGoJS)
        // @ts-ignore
        const contextMenu = this.factory(go.HTMLInfo, {
          show: this.showContextMenu.bind(this),
          hide: this.hideContextMenu.bind(this)
        })
        this.workflow.diagram.contextMenu = contextMenu
        const dia = this.workflow.diagram
        if (dia) {
          dia.clear()
          dia.addDiagramListener("SelectionDeleted", e=> {
            e.subject.each((n:any)=> {
              if ("category" in n.data) {
                delete this.mapNode[n.data.key]
                for (const l of this.linkMap[n.data.key].incoming) {
                  delete this.animations[l.key]
                  if (this.linkDataSubscription[l.key]) {
                    this.linkDataSubscription[l.key].unsubscribe()
                    delete this.linkDataSubscription[l.key]
                  }
                }
                for (const l of this.linkMap[n.data.key].outgoing) {
                  delete this.animations[l.key]
                  if (this.linkDataSubscription[l.key]) {
                    this.linkDataSubscription[l.key].unsubscribe()
                    delete this.linkDataSubscription[l.key]
                  }
                }
                delete this.linkMap[n.data.key]

              }
              console.log(n.data)
            })
          })
          dia.addDiagramListener("LinkDrawn", e=>this.linkDrawn(e))
          // dia.nodeTemplate.contextMenu = this.factory("ContextMenu",
          //   this.factory("ContextMenuButton",
          //     this.factory(go.TextBlock, "Toggle On/Off"),
          //     {click: (e, o) => this.toggleNode(e, o)}
          //   )
          // )
          dia.addDiagramListener("ExternalObjectsDropped", e=> {e.subject.each((n:any) => {
            const currentTime = new Date().getTime().toString()
            n.data.key = n.data.key + currentTime
            this.mapNode[n.data.key] = n
            })

          })
          dia.nodeTemplate.contextMenu = contextMenu

          dia.addDiagramListener("LayoutCompleted", e=> {
            console.log('layoutCompleted')
            if (!completeInitial) {
              dia.links.each(link => {
                const animation = new go.Animation()
                animation.easing = go.Animation.EaseLinear
                const pipe = link.findObject("PIPE")
                if (pipe) {
                  animation.add(pipe, "strokeDashOffset", 20, 0)
                }
                if (!(link.data.from in this.linkMap)) {
                  this.linkMap[link.data.from] = {outgoing: [], incoming: []}
                }
                if (!(link.data.to in this.linkMap)) {
                  this.linkMap[link.data.to] = {outgoing: [], incoming: []}
                }


                animation.runCount = Infinity
                let key = ""
                if (link.key) {
                  if (typeof link.key === "number") {
                    key = link.key.toString()
                    // @ts-ignore
                    this.animations[link.key.toString()] = {status: false, animation: animation}
                  } else {
                    key = link.key
                    // @ts-ignore
                    this.animations[link.key] = {status: false, animation: animation}
                  }
                }

                this.linkMap[link.data.from].outgoing.push({key: key, name: link.data.to})
                this.linkMap[link.data.to].incoming.push({key: key, name: link.data.from})
              })
              dia.nodes.each(node => {
                this.mapNode[node.data.key] = node
              })

              completeInitial = true
            }

          })
          this.state = produce(this.state, draft => {
            draft.skipsDiagramUpdate = false;
            draft.diagramNodeData = [...this.diagramNodeData]
            draft.diagramLinkData = [...this.diagramLinkData]
          })
          this.finishedTrigger.next(true)
        }

        //dia.commitTransaction("add animation")
        // @ts-ignore

        this.diagram.emit({nodes: this.workflow.diagram.model.nodeDataArray, links: this.workflow.diagram.model.linkDataArray, diagram:this.dia})
      }
    }, 1000)
  }

  addAnimation() {

  }

  toggleNode(e: any, o: any) {
    const dia = this.workflow?.diagram
    if (dia) {
      if (o.part) {
        const node = dia.findNodeForKey(o.part.data.key)
        if (node) {
          switch (o.part.data.category) {
            case "Chemical":
              node.findLinksOutOf().each(this.toggleLinkAnimation.bind(this))
              break
            case "Valve":
              node.findLinksOutOf().each(this.toggleLinkAnimation.bind(this))
              node.findLinksInto().each(this.toggleLinkAnimation.bind(this))
              break
          }
        }
      }
    }
  }

  toggleLinks(node: any, incoming: boolean) {
    if (node) {
      if (incoming) {
        node.findLinksInto().each(this.toggleLinkAnimation.bind(this))
      } else {
        node.findLinksOutOf().each(this.toggleLinkAnimation.bind(this))
      }
    }
  }

  cxcommand(event: any) {
    const val = event.currentTarget.id;

    if (this.workflow) {
      const diagram = this.workflow.diagram
      if (val.startsWith("incoming")||val.startsWith("outgoing")) {
        const key = val.replace("incoming", "").replace("outgoing", "")
        if (this.animations[key]) {
          if (!this.animations[key].status) {
            this.animations[key].animation.start()
          } else {
            this.animations[key].animation.stop()
          }
          this.animations[key].status = !this.animations[key].status
          const link = diagram.findLinkForKey(key)
          if (link) {
            link.data.status = !link.data.status
          }
        }
      } else {
        switch (val) {
          case "toggleOutgoingAll":
            this.toggleLinks(this.contextedObject, false)
            break;
          case "toggleIncomingAll":
            this.toggleLinks(this.contextedObject, true)
            break;
          case "cut": diagram.commandHandler.cutSelection(); break;
          case "copy": diagram.commandHandler.copySelection(); break;
          case "paste": diagram.commandHandler.pasteSelection(diagram.toolManager.contextMenuTool.mouseDownPoint); break;
          case "delete": diagram.commandHandler.deleteSelection(); break;
          case "color": {
            // @ts-ignore
            const color = window.getComputedStyle(event.target)['background-color'];
            this.changeColor(diagram, color); break;
          }
        }
      }
      diagram.currentTool.stopTool();
    }
  }

  changeColor(diagram: go.Diagram, color: string) {
    // Always make changes in a transaction, except when initializing the diagram.
    diagram.startTransaction("change color");
    diagram.selection.each(node => {
      if (node instanceof go.Node) {  // ignore any selected Links and simple Parts
        // Examine and modify the data, not the Node directly.
        const data = node.data;
        // Call setDataProperty to support undo/redo as well as
        // automatically evaluating any relevant bindings.
        diagram.model.setDataProperty(data, "color", color);
      }
    });
    diagram.commitTransaction("change color");
  }

  submitData() {
    if (this.workflow) {
      this.web.submitData(this.workflow.diagram.model.toJson()).subscribe(d => {
        if (this.workflow) {
          const enabledLink: string[] = []
          this.workflow.diagram.links.each(link => {
            let key = ""
            console.log(link.data)
            if (link.key) {
              if (typeof link.key === "number") {
                key = link.key.toString()
              } else {
                key = link.key
              }
            }
            if (link.data.status) {
              enabledLink.push(key)
              if (!this.data.linkSubject[key]) {
                this.data.linkSubject[key] = new Subject<TimeSeriesData>()
                this.linkDataSubscription[key] = this.data.linkSubject[key].subscribe((data: TimeSeriesData) => {
                  this.workflow?.diagram.model.setDataProperty(link.data, "text", data.value)
                  console.log(link.data)
                })
              }
            }
          })
          this.data.enabledLink = enabledLink
          this.data.stopWatchingLinks()
          this.data.startWatchingLinks(this.data.enabledLink)
        }
      }, err => {
        alert("Cannot send data to backend")
      })
    }
  }

  ngOnDestroy() {
    for (const s in this.linkDataSubscription) {
      this.linkDataSubscription[s].unsubscribe()
    }
  }
}
