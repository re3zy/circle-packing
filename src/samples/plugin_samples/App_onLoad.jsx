import { useEffect, useRef, useState } from "react";
import "./App.css";
import {
  client,
  useConfig,
  useEditorPanelConfig,
  useActionTrigger,
  useVariable,
} from "@sigmacomputing/plugin";

function App() {
  useEditorPanelConfig([
    { name: "backgroundColor", type: "text", defaultValue: "#ffffff" },
    {
      type: "action-trigger",
      name: "onLoadAction",
      label: "onLoad",
    },
    {
      type: "action-trigger",
      name: "onVar1ChangeAction",
      label: "onVar1Change",
    },
    {
      type: "action-trigger",
      name: "onVar2ChangeAction",
      label: "onVar2Change",
    },
    {
      type: "action-trigger",
      name: "onVar3ChangeAction",
      label: "onVar3Change",
    },
    {
      type: "action-trigger",
      name: "onVar4ChangeAction",
      label: "onVar4Change",
    },
    // inboundVar1 group
    { name: "inboundVar1", type: "group" },
    { name: "var1Control", source: "inboundVar1", type: "variable" },
    { name: "var1FiresOnLoad", source: "inboundVar1", type: "checkbox", defaultValue: true },
    // inboundVar2 group
    { name: "inboundVar2", type: "group" },
    { name: "var2Control", source: "inboundVar2", type: "variable" },
    { name: "var2FiresOnLoad", source: "inboundVar2", type: "checkbox", defaultValue: true },
    // inboundVar3 group
    { name: "inboundVar3", type: "group" },
    { name: "var3Control", source: "inboundVar3", type: "variable" },
    { name: "var3FiresOnLoad", source: "inboundVar3", type: "checkbox", defaultValue: true },
    // inboundVar4 group
    { name: "inboundVar4", type: "group" },
    { name: "var4Control", source: "inboundVar4", type: "variable" },
    { name: "var4FiresOnLoad", source: "inboundVar4", type: "checkbox", defaultValue: true },
  ]);

  const config = useConfig();
  const triggerOnLoadAction = useActionTrigger(config.onLoadAction);

  // set background color
  const backgroundColor = client.config.getKey("backgroundColor");
  console.log("bg: " + backgroundColor);
  // Action triggers for each variable
  const triggerOnVar1ChangeAction = useActionTrigger(config.onVar1ChangeAction);
  const triggerOnVar2ChangeAction = useActionTrigger(config.onVar2ChangeAction);
  const triggerOnVar3ChangeAction = useActionTrigger(config.onVar3ChangeAction);
  const triggerOnVar4ChangeAction = useActionTrigger(config.onVar4ChangeAction);

  // Variable data
  const var1ControlData = useVariable(config.var1Control);
  const var2ControlData = useVariable(config.var2Control);
  const var3ControlData = useVariable(config.var3Control);
  const var4ControlData = useVariable(config.var4Control);

  // Checkbox values
  const var1FiresOnLoadValue = config.var1FiresOnLoad;
  const var2FiresOnLoadValue = config.var2FiresOnLoad;
  const var3FiresOnLoadValue = config.var3FiresOnLoad;
  const var4FiresOnLoadValue = config.var4FiresOnLoad;

  // Access the defaultValues safely
  const var1Control =
    var1ControlData[0] && var1ControlData[0].defaultValue ? var1ControlData[0].defaultValue.value : undefined;
  const var2Control =
    var2ControlData[0] && var2ControlData[0].defaultValue ? var2ControlData[0].defaultValue.value : undefined;
  const var3Control =
    var3ControlData[0] && var3ControlData[0].defaultValue ? var3ControlData[0].defaultValue.value : undefined;
  const var4Control =
    var4ControlData[0] && var4ControlData[0].defaultValue ? var4ControlData[0].defaultValue.value : undefined;

  // Flag to track if initial render has happened
  const initialRenderRef = useRef(true);

  // Keep track of previous values
  const prevVar1ControlRef = useRef(var1Control);
  const prevVar2ControlRef = useRef(var2Control);
  const prevVar3ControlRef = useRef(var3Control);
  const prevVar4ControlRef = useRef(var4Control);

  // State to track if onLoadAction should be triggered
  const [shouldTriggerOnLoad, setShouldTriggerOnLoad] = useState(false);

  // Log values for debugging
  console.log("var1Control: " + var1Control);
  console.log("var2Control: " + var2Control);
  console.log("var3Control: " + var3Control);
  console.log("var4Control: " + var4Control);

  // Helper function to determine if a value has meaningfully changed
  // This treats null and undefined as equivalent
  const hasValueChanged = (prevValue, newValue) => {
    // If both values are null or undefined, consider them the same
    if (prevValue == null && newValue == null) {
      return false;
    }
    // Otherwise, check if they're different
    return prevValue !== newValue;
  };

  // Initial onLoad effect
  useEffect(() => {
    if (initialRenderRef.current) {
      console.log("Triggering onLoadAction because the page was loaded");
      triggerOnLoadAction();

      // Initialize the previous values after the first render
      prevVar1ControlRef.current = var1Control;
      prevVar2ControlRef.current = var2Control;
      prevVar3ControlRef.current = var3Control;
      prevVar4ControlRef.current = var4Control;

      initialRenderRef.current = false;
    }
  }, [triggerOnLoadAction, var1Control, var2Control, var3Control, var4Control]);

  // Monitor all variables for changes in a single effect
  useEffect(() => {
    // Skip this effect on the initial render
    if (initialRenderRef.current) {
      return;
    }

    let shouldFireOnLoad = false;

    // Check var1 changes
    if (hasValueChanged(prevVar1ControlRef.current, var1Control)) {
      console.log("var1 changed from", prevVar1ControlRef.current, "to", var1Control);
      triggerOnVar1ChangeAction();
      if (var1FiresOnLoadValue) {
        shouldFireOnLoad = true;
      }
    }

    // Check var2 changes
    if (hasValueChanged(prevVar2ControlRef.current, var2Control)) {
      console.log("var2 changed from", prevVar2ControlRef.current, "to", var2Control);
      triggerOnVar2ChangeAction();
      if (var2FiresOnLoadValue) {
        shouldFireOnLoad = true;
      }
    }

    // Check var3 changes
    if (hasValueChanged(prevVar3ControlRef.current, var3Control)) {
      console.log("var3 changed from", prevVar3ControlRef.current, "to", var3Control);
      triggerOnVar3ChangeAction();
      if (var3FiresOnLoadValue) {
        shouldFireOnLoad = true;
      }
    }

    // Check var4 changes
    if (hasValueChanged(prevVar4ControlRef.current, var4Control)) {
      console.log("var4 changed from", prevVar4ControlRef.current, "to", var4Control);
      triggerOnVar4ChangeAction();
      if (var4FiresOnLoadValue) {
        shouldFireOnLoad = true;
      }
    }

    // Set flag to trigger onLoad in the next effect
    if (shouldFireOnLoad) {
      setShouldTriggerOnLoad(true);
    }

    // Update previous values
    prevVar1ControlRef.current = var1Control;
    prevVar2ControlRef.current = var2Control;
    prevVar3ControlRef.current = var3Control;
    prevVar4ControlRef.current = var4Control;
  }, [
    var1Control,
    var2Control,
    var3Control,
    var4Control,
    var1FiresOnLoadValue,
    var2FiresOnLoadValue,
    var3FiresOnLoadValue,
    var4FiresOnLoadValue,
    triggerOnVar1ChangeAction,
    triggerOnVar2ChangeAction,
    triggerOnVar3ChangeAction,
    triggerOnVar4ChangeAction,
  ]);

  // Dedicated effect for triggering onLoadAction
  useEffect(() => {
    if (shouldTriggerOnLoad) {
      console.log("Triggering onLoadAction due to variable changes");
      triggerOnLoadAction();
      setShouldTriggerOnLoad(false);
    }
  }, [shouldTriggerOnLoad, triggerOnLoadAction]);

  return (
    <div
      style={{
        backgroundColor: backgroundColor,
        width: "100vw",
        height: "100vh",
        margin: 0,
        position: "absolute",
        top: 0,
        left: 0,
      }}
    ></div>
  );
}

export default App;
