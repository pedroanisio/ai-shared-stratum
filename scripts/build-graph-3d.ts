#!/usr/bin/env node
import { readFile, readdir, writeFile } from "fs/promises";
import path from "path";

const ROOT = path.resolve(process.cwd());
const SECTIONS_DIR = path.join(ROOT, "docs", "sections");
const INDEX_PATH = path.join(SECTIONS_DIR, "index.json");
const MAPPING_PATH = path.join(SECTIONS_DIR, "mapping.json");
const OUTPUT_PATH = path.join(ROOT, "docs", "document-graph-3d.html");

// Layout constants
const LAYOUT = {
  PART_RADIUS: 120,
  PART_Y: 80,
  SECTION_RADIUS: 260,
  SECTION_Y: 0,
  SUBSECTION_BASE_RADIUS: 380,
  SUBSECTION_Y: -80,
  REFERENCE_RADIUS: 520,
  REFERENCE_Y: -160,
  CAMERA_Y: 260,
  CAMERA_Z: 650,
} as const;

type IndexSection = {
  id: string;
  number?: number;
  title?: string;
  contentRef: string;
};

type IndexPart = {
  id: string;
  number?: number;
  title?: string;
  sections: string[];
};

type IndexFile = {
  title?: string;
  parts?: IndexPart[];
  sections: IndexSection[];
};

type MappingEntry =
  | string
  | {
      title?: {
        title?: string;
      };
      suffix?: string | null;
    };

type SectionNode = {
  id: string;
  title?: string;
  suffix?: string;
  children?: SectionNode[];
  content?: unknown[];
};

type GraphNode = {
  id: string;
  label: string;
  type: "part" | "section" | "subsection" | "reference";
  x: number;
  y: number;
  z: number;
};

type GraphEdge = {
  source: string;
  target: string;
  type: "hierarchy" | "reference";
};

function mapTitle(mapping: Record<string, MappingEntry>, id: string): string {
  const entry = mapping[id];
  if (!entry) return id;
  if (typeof entry === "string") return entry;
  return entry.title?.title || id;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function collectReferenceIds(value: unknown, refs: Set<string>): void {
  if (typeof value === "string") {
    // Create new regex each call to avoid lastIndex state issues
    const regex = /referenceMap\(\s*["']([^"']+)["']/g;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(value)) !== null) {
      refs.add(match[1]);
    }
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => collectReferenceIds(item, refs));
    return;
  }

  if (isObject(value)) {
    Object.values(value).forEach((child) => collectReferenceIds(child, refs));
  }
}

function collectSubsections(node: SectionNode, list: SectionNode[]): void {
  if (!node.children) return;
  for (const child of node.children) {
    list.push(child);
    collectSubsections(child, list);
  }
}

function layoutRing(
  count: number,
  radius: number,
  y: number,
  angleOffset = 0
): Array<{ x: number; y: number; z: number }> {
  const positions: Array<{ x: number; y: number; z: number }> = [];
  for (let i = 0; i < count; i += 1) {
    const angle = angleOffset + (i / Math.max(1, count)) * Math.PI * 2;
    positions.push({
      x: Math.cos(angle) * radius,
      y,
      z: Math.sin(angle) * radius,
    });
  }
  return positions;
}

function layoutArc(
  count: number,
  centerX: number,
  centerZ: number,
  radius: number,
  y: number,
  spreadAngle = Math.PI / 3
): Array<{ x: number; y: number; z: number }> {
  const positions: Array<{ x: number; y: number; z: number }> = [];
  const centerAngle = Math.atan2(centerZ, centerX);
  const startAngle = centerAngle - spreadAngle / 2;
  for (let i = 0; i < count; i += 1) {
    const angle = count === 1 ? centerAngle : startAngle + (i / (count - 1)) * spreadAngle;
    positions.push({
      x: centerX + Math.cos(angle) * radius,
      y,
      z: centerZ + Math.sin(angle) * radius,
    });
  }
  return positions;
}

async function main(): Promise<void> {
  const indexRaw = await readFile(INDEX_PATH, "utf8");
  const index = JSON.parse(indexRaw) as IndexFile;
  const mappingRaw = await readFile(MAPPING_PATH, "utf8");
  const mapping = JSON.parse(mappingRaw) as Record<string, MappingEntry>;

  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const nodeIds = new Set<string>();

  const sectionEntries = index.sections;
  const sectionMap = new Map(sectionEntries.map((entry) => [entry.id, entry]));

  const partPositions = layoutRing(index.parts?.length ?? 0, LAYOUT.PART_RADIUS, LAYOUT.PART_Y);
  const sectionPositions = layoutRing(sectionEntries.length, LAYOUT.SECTION_RADIUS, LAYOUT.SECTION_Y);

  // Store section positions for subsection layout
  const sectionPosMap = new Map<string, { x: number; y: number; z: number }>();

  if (index.parts && index.parts.length > 0) {
    index.parts.forEach((part, idx) => {
      const label = part.title ? `PART ${part.number ?? ""} ${part.title}`.trim() : part.id;
      const pos = partPositions[idx] || { x: 0, y: LAYOUT.PART_Y, z: 0 };
      nodes.push({ id: part.id, label, type: "part", ...pos });
      nodeIds.add(part.id);
    });
  }

  sectionEntries.forEach((entry, idx) => {
    const label = entry.title ? `${entry.number ?? ""} ${entry.title}`.trim() : entry.id;
    const pos = sectionPositions[idx] || { x: 0, y: LAYOUT.SECTION_Y, z: 0 };
    nodes.push({ id: entry.id, label, type: "section", ...pos });
    nodeIds.add(entry.id);
    sectionPosMap.set(entry.id, pos);
  });

  if (index.parts) {
    for (const part of index.parts) {
      for (const sectionId of part.sections) {
        if (nodeIds.has(part.id) && nodeIds.has(sectionId)) {
          edges.push({ source: part.id, target: sectionId, type: "hierarchy" });
        }
      }
    }
  }

  // Collect all references first to layout them properly
  const allReferenceIds = new Set<string>();
  const sectionRefs = new Map<string, Set<string>>();

  const files = (await readdir(SECTIONS_DIR)).filter((name) => name.endsWith(".json"));
  for (const name of files) {
    if (name === "index.json" || name === "mapping.json") continue;
    const sectionId = name.replace(/\.json$/, "");
    const raw = await readFile(path.join(SECTIONS_DIR, name), "utf8");
    const data = JSON.parse(raw) as SectionNode;

    // Get parent section position for subsection layout
    const parentPos = sectionPosMap.get(sectionId) || { x: 0, y: LAYOUT.SECTION_Y, z: 0 };

    const subsections: SectionNode[] = [];
    collectSubsections(data, subsections);

    // Position subsections in an arc radiating outward from parent section
    const subsectionPositions = layoutArc(
      subsections.length,
      parentPos.x,
      parentPos.z,
      LAYOUT.SUBSECTION_BASE_RADIUS - LAYOUT.SECTION_RADIUS,
      LAYOUT.SUBSECTION_Y,
      Math.PI / 2.5
    );

    subsections.forEach((sub, idx) => {
      const label = mapTitle(mapping, sub.id);
      const pos = subsectionPositions[idx] || { x: parentPos.x, y: LAYOUT.SUBSECTION_Y, z: parentPos.z };
      if (!nodeIds.has(sub.id)) {
        nodes.push({ id: sub.id, label, type: "subsection", ...pos });
        nodeIds.add(sub.id);
      }
      edges.push({ source: sectionId, target: sub.id, type: "hierarchy" });
    });

    // Collect references for this section
    const refIds = new Set<string>();
    collectReferenceIds(data, refIds);
    sectionRefs.set(sectionId, refIds);
    for (const refId of refIds) {
      allReferenceIds.add(refId);
    }
  }

  // Layout all reference nodes in a ring
  const referenceList = Array.from(allReferenceIds);
  const referencePositions = layoutRing(
    referenceList.length,
    LAYOUT.REFERENCE_RADIUS,
    LAYOUT.REFERENCE_Y
  );

  referenceList.forEach((refId, idx) => {
    if (!nodeIds.has(refId)) {
      const pos = referencePositions[idx] || { x: 0, y: LAYOUT.REFERENCE_Y, z: 0 };
      nodes.push({
        id: refId,
        label: mapTitle(mapping, refId),
        type: "reference",
        ...pos,
      });
      nodeIds.add(refId);
    }
  });

  // Add reference edges
  for (const [sectionId, refIds] of sectionRefs) {
    for (const refId of refIds) {
      edges.push({ source: sectionId, target: refId, type: "reference" });
    }
  }

  const title = index.title ?? "Document Graph";
  const data = { nodes, edges };

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title} - 3D Graph</title>
    <style>
      :root {
        color-scheme: light;
        font-family: "IBM Plex Sans", "Segoe UI", sans-serif;
        background: #f7f5f2;
        color: #1c1c1c;
      }
      body {
        margin: 0;
        padding: 0;
      }
      #app {
        height: 100vh;
        width: 100vw;
        position: relative;
        overflow: hidden;
      }
      .toolbar {
        position: absolute;
        top: 16px;
        left: 16px;
        display: flex;
        gap: 0.6rem;
        flex-wrap: wrap;
        z-index: 2;
      }
      .graph-btn {
        border: 1px solid #d1ccc4;
        background: #fff;
        color: #2c2a27;
        border-radius: 999px;
        padding: 0.4rem 0.9rem;
        font-weight: 600;
        cursor: pointer;
      }
      .graph-btn:hover {
        background: #f1ede6;
      }
      .legend {
        position: absolute;
        bottom: 16px;
        left: 16px;
        background: rgba(255, 255, 255, 0.9);
        border: 1px solid #e1ddd6;
        border-radius: 12px;
        padding: 12px 14px;
        font-size: 0.9rem;
        z-index: 2;
      }
      .legend span {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        margin-right: 0.8rem;
      }
      .dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        display: inline-block;
      }
      #label {
        position: absolute;
        right: 16px;
        top: 16px;
        padding: 10px 14px;
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.95);
        border: 1px solid #e1ddd6;
        max-width: 320px;
        font-weight: 600;
        z-index: 2;
      }
    </style>
  </head>
  <body>
    <div id="app"></div>
    <div class="toolbar">
      <button class="graph-btn" id="reset">Reset View</button>
      <a class="graph-btn" href="document-graph.html">2D Graph</a>
      <a class="graph-btn" href="stratum-v.2.5.html">Document</a>
    </div>
    <div id="label">Hover nodes to inspect</div>
    <div class="legend">
      <span><span class="dot" style="background:#3f6fd3"></span>Part</span>
      <span><span class="dot" style="background:#2c2a27"></span>Section</span>
      <span><span class="dot" style="background:#b86b00"></span>Subsection</span>
      <span><span class="dot" style="background:#7b5ea7"></span>Reference</span>
    </div>
    <script type="importmap">
      {
        "imports": {
          "three": "https://cdn.jsdelivr.net/npm/three@0.162.0/build/three.module.js",
          "three/examples/jsm/controls/OrbitControls.js": "https://cdn.jsdelivr.net/npm/three@0.162.0/examples/jsm/controls/OrbitControls.js"
        }
      }
    </script>
    <script type="module">
      import * as THREE from "three";
      import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

      const data = ${JSON.stringify(data)};
      const container = document.getElementById("app");
      const label = document.getElementById("label");

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0xf7f5f2);

      const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 4000);
      camera.position.set(0, ${LAYOUT.CAMERA_Y}, ${LAYOUT.CAMERA_Z});

      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      container.appendChild(renderer.domElement);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.minDistance = 120;
      controls.maxDistance = 1600;

      const light = new THREE.HemisphereLight(0xffffff, 0x444444, 1.1);
      scene.add(light);

      const colorMap = {
        part: 0x3f6fd3,
        section: 0x2c2a27,
        subsection: 0xb86b00,
        reference: 0x7b5ea7,
      };

      const nodeMeshes = new Map();
      data.nodes.forEach((node) => {
        const geometry = new THREE.SphereGeometry(node.type === "part" ? 8 : node.type === "section" ? 6 : 4, 16, 16);
        const material = new THREE.MeshStandardMaterial({ color: colorMap[node.type] || 0x888888 });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(node.x, node.y, node.z);
        mesh.userData = node;
        scene.add(mesh);
        nodeMeshes.set(node.id, mesh);
      });

      const hierarchyMaterial = new THREE.LineBasicMaterial({ color: 0xb1a79a });
      const referenceMaterial = new THREE.LineDashedMaterial({ color: 0x7b5ea7, dashSize: 8, gapSize: 6 });

      data.edges.forEach((edge) => {
        const source = nodeMeshes.get(edge.source);
        const target = nodeMeshes.get(edge.target);
        if (!source || !target) return;
        const points = [source.position, target.position];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = edge.type === "reference" ? referenceMaterial : hierarchyMaterial;
        const line = new THREE.Line(geometry, material);
        if (edge.type === "reference") {
          line.computeLineDistances();
        }
        scene.add(line);
      });

      const raycaster = new THREE.Raycaster();
      const pointer = new THREE.Vector2();
      let hovered = null;

      function onPointerMove(event) {
        pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
        pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(pointer, camera);
        const intersects = raycaster.intersectObjects(Array.from(nodeMeshes.values()));
        if (intersects.length > 0) {
          const hit = intersects[0].object;
          if (hovered !== hit) {
            hovered = hit;
            label.textContent = hit.userData.label || hit.userData.id;
          }
        } else if (hovered) {
          hovered = null;
          label.textContent = "Hover nodes to inspect";
        }
      }

      window.addEventListener("pointermove", onPointerMove);

      document.getElementById("reset").addEventListener("click", () => {
        controls.reset();
        camera.position.set(0, ${LAYOUT.CAMERA_Y}, ${LAYOUT.CAMERA_Z});
      });

      window.addEventListener("resize", () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      });

      function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
      }
      animate();
    </script>
  </body>
</html>`;

  await writeFile(OUTPUT_PATH, html, "utf8");
  console.log(`Wrote ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
