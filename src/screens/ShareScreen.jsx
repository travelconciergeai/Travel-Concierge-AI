import React, { useEffect, useRef, useState } from "react";
import { Icon } from "../icons.jsx";
import { mockData } from "../mockData.jsx";
import { Placeholder, Button, Card, Drawer, Modal, OptimizeMenu, SectionHeader, SmartImg, Stat, TabRow, Tag, Topbar, useToast } from "../ui.jsx";

// Placeholder for the share-page screen — currently routed inside PlanScreen modal.
// This file exists so the script tag in index.html doesn't 404. We expose a noop.
const ShareScreen = () => null;
window.ShareScreen = ShareScreen;
export { ShareScreen };
