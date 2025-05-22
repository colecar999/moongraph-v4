import React, { useEffect, useState } from 'react';
import { Cosmograph } from '@cosmograph/react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from './ui/dropdown-menu';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { Input } from './ui/input';

import { CosmographProvider } from '@cosmograph/react';

interface Graph {
  id: string;
  name: string;
}

interface GraphData {
  id: string;
  name: string;
  entities: any[];
  relationships: any[];
}

interface CosmographSectionProps {
  apiBaseUrl: string;
  authToken: string | null;
}

// ErrorBoundary for robust error handling
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: any }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, errorInfo: any) {
    // You can log error to an error reporting service here
    console.error('Cosmograph ErrorBoundary caught an error:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full w-full p-8">
          <h2 className="text-lg font-bold text-red-600 mb-2">Something went wrong in the graph visualization.</h2>
          <pre className="bg-red-100 text-red-800 p-2 rounded mb-4 max-w-xl overflow-x-auto">{String(this.state.error)}</pre>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Reset Graph
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const CosmographSection: React.FC<CosmographSectionProps> = ({ apiBaseUrl, authToken }) => {
  const [graphs, setGraphs] = useState<Graph[]>([]);
  const [selectedGraph, setSelectedGraph] = useState<Graph | null>(null);
  const [loading, setLoading] = useState(false);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [graphLoading, setGraphLoading] = useState(false);
  const [graphError, setGraphError] = useState<string | null>(null);
  const [nodeSize, setNodeSize] = useState(1);
  const [linkWidth, setLinkWidth] = useState(1.5);
  const [linkShade, setLinkShade] = useState(0.5);
  const [linkDistance, setLinkDistance] = useState(10);
  const [linkStrength, setLinkStrength] = useState(1);
  const [nodeRepulsion, setNodeRepulsion] = useState(1);
  const [gravity, setGravity] = useState(0.4);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const cosmographRef = React.useRef<any>(null);

  // Map nodes for visualization: id = label, displayId = original id
  const vizNodes = React.useMemo(
    () => (graphData?.entities || []).map((node: any) => ({
      ...node,
      displayId: node.id,
      id: node.label, // for display
    })),
    [graphData]
  );

  // Dynamic color palette for node types (must be after vizNodes is defined)
  const palette = [
    '#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#ef4444',
    '#6366f1', '#f472b6', '#34d399', '#fbbf24', '#a78bfa', '#f87171', '#60a5fa',
    '#eab308', '#facc15', '#a3e635', '#14b8a6', '#f43f5e', '#a3a3a3', '#0ea5e9',
  ];
  const typeList = Array.from(new Set(vizNodes.map(n => (n as any).type || 'Unknown')));
  const typeColors: Record<string, string> = {};
  typeList.forEach((type, idx) => {
    if (!typeColors[type]) {
      typeColors[type] = palette[idx] || `hsl(${(idx * 47) % 360}, 70%, 60%)`;
    }
  });

  // Map links for visualization: source/target = label of the node
  const idToLabel = React.useMemo(
    () => Object.fromEntries((graphData?.entities || []).map((n: any) => [n.id, n.label])),
    [graphData]
  );
  const vizLinks = React.useMemo(
    () => (graphData?.relationships || []).map((link: any) => ({
      ...link,
      source: idToLabel[link.source_id],
      target: idToLabel[link.target_id],
    })),
    [graphData, idToLabel]
  );

  // Build neighbor map for fast lookup
  const neighborMap = React.useMemo(() => {
    const map: Record<string, Set<string>> = {};
    vizLinks.forEach(link => {
      map[link.source] = map[link.source] || new Set();
      map[link.target] = map[link.target] || new Set();
      map[link.source].add(link.target);
      map[link.target].add(link.source);
    });
    return map;
  }, [vizLinks]);

  const isNodeSelected = selectedNode !== null;
  const isTypeSelected = selectedType !== null;

  const highlightedNodes = React.useMemo(() => {
    if (isNodeSelected) {
      const neighbors = neighborMap[selectedNode!] || new Set();
      return new Set<string>([String(selectedNode), ...Array.from(neighbors).map(String)]);
    }
    if (isTypeSelected) {
      return new Set(vizNodes.filter(n => n.type === selectedType).map(n => n.id));
    }
    return new Set<string>();
  }, [selectedNode, selectedType, neighborMap, vizNodes]);

  const highlightedLinks = React.useMemo(() => {
    if (isNodeSelected) {
      return new Set(
        vizLinks
          .filter(link => link.source === selectedNode || link.target === selectedNode)
          .map(link => `${link.source}--${link.target}`)
      );
    }
    if (isTypeSelected) {
      const typeNodeIds = new Set(vizNodes.filter(n => n.type === selectedType).map(n => n.id));
      return new Set(
        vizLinks
          .filter(link => typeNodeIds.has(link.source) || typeNodeIds.has(link.target))
          .map(link => `${link.source}--${link.target}`)
      );
    }
    return new Set<string>();
  }, [selectedNode, selectedType, vizLinks, vizNodes]);

  const showLabelsFor = React.useMemo(() => {
    if (isNodeSelected || isTypeSelected) {
      return Array.from(highlightedNodes).map(id => ({ id: String(id) }));
    }
    return undefined;
  }, [isNodeSelected, isTypeSelected, highlightedNodes]);
  const isDefaultState = !isNodeSelected && !isTypeSelected;

  // Compute showLabelsForLinks: only show labels for links directly connected to the selected node
  const showLabelsForLinks = React.useMemo(() => {
    if (!selectedNode) return undefined;
    return vizLinks
      .filter(link => link.source === selectedNode || link.target === selectedNode)
      .map(link => ({ source: link.source, target: link.target }));
  }, [selectedNode, vizLinks]);

  // Search logic: filter node labels
  useEffect(() => {
    if (!searchValue) {
      setSearchResults([]);
      setSearchOpen(false);
      return;
    }
    const results = vizNodes.filter(n =>
      n.label && n.label.toLowerCase().includes(searchValue.toLowerCase())
    );
    setSearchResults(results);
    setSearchOpen(results.length > 0);
  }, [searchValue, vizNodes]);

  useEffect(() => {
    const fetchGraphs = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${apiBaseUrl}/graphs`, {
          headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
        });
        if (!res.ok) throw new Error('Failed to fetch graphs');
        const data = await res.json();
        setGraphs(data);
        if (data.length > 0) setSelectedGraph(data[0]);
      } catch (err) {
        setGraphs([]);
      } finally {
        setLoading(false);
      }
    };
    fetchGraphs();
  }, [apiBaseUrl, authToken]);

  useEffect(() => {
    if (!selectedGraph) {
      setGraphData(null);
      return;
    }
    const fetchGraphData = async () => {
      setGraphLoading(true);
      setGraphError(null);
      try {
        const res = await fetch(`${apiBaseUrl}/graph/${encodeURIComponent(selectedGraph.name)}`, {
          headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
        });
        if (!res.ok) throw new Error('Failed to fetch graph data');
        const data = await res.json();
        setGraphData(data);
      } catch (err: any) {
        setGraphError(err.message || 'Failed to load graph');
        setGraphData(null);
      } finally {
        setGraphLoading(false);
      }
    };
    fetchGraphData();
  }, [selectedGraph, apiBaseUrl, authToken]);

  // This effect triggers when selectedNode changes, indicating a new node was chosen via search.
  useEffect(() => {
    let actionTimerId: NodeJS.Timeout | undefined;

    // This effect now primarily handles the *second* step of the zoom (applying setZoomLevel)
    // after zoomToNode has been initiated in the onMouseDown handler.
    if (selectedNode && cosmographRef.current?.setZoomLevel) {
      const nodeToZoom = vizNodes.find(n => n.id === selectedNode);

      if (nodeToZoom) {
        // Estimate duration for zoomToNode to complete its centering. This might need tuning.
        const zoomToNodeEstimatedDuration = 750; // ms
        const finalZoomLevel = 10;
        const finalZoomAnimationDuration = 250; // ms, for the setZoomLevel animation.

        // After zoomToNode (called in onMouseDown) is expected to have centered the node,
        // set the specific desired zoom level.
        actionTimerId = setTimeout(() => {
          // Double-check that the component is still mounted and the node is still selected.
          if (cosmographRef.current?.setZoomLevel && selectedNode === nodeToZoom.id) {
            cosmographRef.current.setZoomLevel(finalZoomLevel, finalZoomAnimationDuration);
          }
        }, zoomToNodeEstimatedDuration); // Wait for zoomToNode to likely finish.
      }
    }

    return () => {
      if (actionTimerId) {
        clearTimeout(actionTimerId);
      }
    }
  }, [selectedNode, vizNodes]); // Re-run if selectedNode or vizNodes changes.

  return (
    <div className="p-8 w-full h-full flex flex-col items-center justify-center">
      <h1 className="text-2xl font-bold mb-4">Cosmograph Visualization</h1>
      <div className="mb-6 w-full max-w-3xl flex flex-col items-center">
        <div className="flex flex-row items-end gap-6 w-full mb-4">
          {/* Graph Selector */}
          <div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-64 justify-between">
                  {selectedGraph ? selectedGraph.name : 'Select a graph'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64">
                <DropdownMenuLabel>Select Graph</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {loading ? (
                  <DropdownMenuItem disabled>Loading...</DropdownMenuItem>
                ) : graphs.length === 0 ? (
                  <DropdownMenuItem disabled>No graphs available</DropdownMenuItem>
                ) : (
                  graphs.map((graph) => (
                    <DropdownMenuItem
                      key={graph.id}
                      onSelect={() => setSelectedGraph(graph)}
                    >
                      {graph.name}
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            {selectedGraph && (
              <div className="mt-2 text-muted-foreground text-xs text-center">
                Selected graph: <span className="font-semibold">{selectedGraph.name}</span>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="w-full h-[600px] bg-muted rounded-lg flex items-center justify-center">
        {/* Cosmograph graph will be rendered here */}
        {graphLoading ? (
          <span className="text-muted-foreground">Loading graph...</span>
        ) : graphError ? (
          <span className="text-destructive">{graphError}</span>
        ) : graphData && vizNodes.length > 0 ? (
          <>
            <div className="w-full h-full relative">
              {/* Search Field (upper right, single floating element) */}
              <Input
                type="text"
                placeholder="Search..."
                value={searchValue}
                onChange={e => setSearchValue(e.target.value)}
                className="bg-background/70 text-white border-white/70 focus:border-white focus:ring-0 text-xs px-2 py-1 rounded"
                style={{
                  position: 'absolute',
                  top: 24,
                  right: 24,
                  minWidth: 180,
                  maxWidth: 220,
                  width: 200,
                  background: 'rgba(30,30,30,0.55)',
                  borderRadius: 8,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                  zIndex: 20,
                  border: '1px solid rgba(255,255,255,0.7)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                }}
                onFocus={() => setSearchOpen(searchResults.length > 0)}
                onBlur={() => setTimeout(() => setSearchOpen(false), 150)}
              />
              {/* Search Results Dropdown */}
              {searchOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 72,
                    right: 24,
                    minWidth: 180,
                    maxWidth: 220,
                    width: 200,
                    background: 'rgba(30,30,30,0.95)',
                    borderRadius: 8,
                    border: '1px solid rgba(255,255,255,0.7)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                    zIndex: 30,
                    maxHeight: 180,
                    overflowY: 'auto',
                  }}
                >
                  {searchResults.map((node, idx) => (
                    <div
                      key={node.id}
                      className="px-3 py-1 text-xs text-white/90 cursor-pointer hover:bg-white/10"
                      onMouseDown={e => {
                        e.preventDefault();
                        setSelectedNode(node.id);
                        setSelectedType(null);
                        setSearchValue(node.label);
                        setSearchOpen(false);
                        if (cosmographRef.current?.zoomToNode) {
                          cosmographRef.current.zoomToNode({ id: node.id });
                        }
                      }}
                    >
                      {node.label}
                    </div>
                  ))}
                </div>
              )}
              <ErrorBoundary>
                <CosmographProvider nodes={vizNodes} links={vizLinks}>
                  <Cosmograph
                    ref={cosmographRef}
                    nodes={vizNodes}
                    links={vizLinks}
                    nodeColor={(node: any) => {
                      if (!isNodeSelected && !isTypeSelected) return typeColors[(node as any).type || 'Unknown'];
                      return highlightedNodes.has(node.id)
                        ? typeColors[(node as any).type || 'Unknown']
                        : 'rgba(180,180,180,0.3)'; // dim non-highlighted
                    }}
                    linkColor={(link: any) => {
                      if (!isNodeSelected && !isTypeSelected) {
                        const shade = Math.round(linkShade * 255);
                        return `rgb(${shade},${shade},${shade})`;
                      }
                      const key = `${link.source}--${link.target}`;
                      if (highlightedLinks.has(key)) {
                        return '#fff'; // highlight color
                      }
                      return 'rgba(180,180,180,0.2)'; // dim
                    }}
                    nodeSize={(node: any) => {
                      if (!isNodeSelected && !isTypeSelected) return nodeSize;
                      return highlightedNodes.has(node.id) ? nodeSize * 1.3 : nodeSize * 0.8;
                    }}
                    linkWidth={(link: any) => {
                      if (!isNodeSelected && !isTypeSelected) return linkWidth;
                      const key = `${link.source}--${link.target}`;
                      return highlightedLinks.has(key) ? linkWidth * 1.5 : linkWidth * 0.7;
                    }}
                    showDynamicLabels={isDefaultState}
                    showTopLabels={false}
                    showLabelsFor={showLabelsFor}
                    simulationLinkDistance={linkDistance}
                    simulationLinkSpring={linkStrength}
                    simulationRepulsion={nodeRepulsion}
                    simulationGravity={gravity}
                    onClick={(node: any) => {
                      setSelectedNode(node?.id || null);
                      setSelectedType(null);
                    }}
                    backgroundColor="#000"
                  />
                </CosmographProvider>
              </ErrorBoundary>
              {/* Overlay to clear selection on background click */}
              {(isNodeSelected || isTypeSelected) && (
                <div
                  style={{ position: 'absolute', inset: 0, zIndex: 1, cursor: 'pointer' }}
                  onClick={e => {
                    setSelectedNode(null);
                    setSelectedType(null);
                    setSearchValue('');
                  }}
                  tabIndex={-1}
                  aria-label="Clear selection"
                />
              )}
              {/* Floating Legend Card */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 24,
                  right: 24,
                  background: 'rgba(30,30,30,0.55)',
                  borderRadius: 8,
                  padding: 16,
                  maxHeight: 220,
                  minWidth: 180,
                  overflowY: 'auto',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                  zIndex: 10,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  border: '1px solid rgba(255,255,255,0.7)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                }}
              >
                <div className="font-semibold text-xs mb-2 text-white/80 tracking-wide">Legend</div>
                {typeList.map(type => (
                  <div
                    key={type}
                    className={`flex items-center gap-2 mb-1 cursor-pointer ${selectedType === type ? 'ring-2 ring-white' : ''}`}
                    onClick={() => {
                      setSelectedType(selectedType === type ? null : type);
                      setSelectedNode(null);
                    }}
                  >
                    <span style={{ background: typeColors[type], width: 14, height: 14, borderRadius: '50%', display: 'inline-block' }} />
                    <span className="capitalize text-xs text-white/90">{type}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : selectedGraph ? (
          <span className="text-muted-foreground">No nodes to display in this graph.</span>
        ) : (
          <span className="text-muted-foreground">Select a graph to visualize.</span>
        )}
      </div>
    </div>
  );
};

export default CosmographSection; 