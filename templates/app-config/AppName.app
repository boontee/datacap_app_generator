<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<!--
  IBM Datacap 9.1.10 — Application Configuration Template
  Token substitutions applied by the generator:
    AppName     → app.name  (e.g. APInvoice)
    @SERVER     → app.server
    @BATCHDIR   → app.installPath + \batches
    @IMAGEDIR   → app.installPath + \images\Input
    @EXPORTDIR  → app.installPath + \export
    @FPDIR      → app.installPath + \fingerprint
    @ADMINDSN   → app.adminDSN
    @ENGINEDSN  → app.engineDSN
  Secrets (API keys, passwords) must be entered via Application Manager GUI —
  the GUI encrypts them as [encoded] or [secured] blocks automatically.
-->
<app name="AppName" ver="9" src_ver="3">

  <!-- Datacap Task Manager server -->
  <k name="tmservers">
    <k name="tms" ip="@SERVER" port="2402" retry="3" protocol="300"/>
  </k>

  <!-- Runtime batch directory name (relative to app root) -->
  <k name="runtime" v="batches"/>

  <!-- Database connection strings — set via Application Manager GUI -->
  <k name="tmengine" cs=""/>
  <k name="tmadmin"  cs=""/>

  <!-- SetupDCO and rules paths -->
  <k name="dco_AppName">
    <k name="setupdco"       v="AppName.xml"/>
    <k name="rules"          v="rules"/>
    <k name="imagefix"       v="imagefix.ini"/>
    <k name="UseFPXML"       v="True"/>
    <k name="fingerprintconn" cs=""/>
    <!-- Lookup DB connection string — set via Application Manager GUI if used -->
    <k name="lookupdb"       cs=""/>
    <!-- Input image directory for VScan / import tasks -->
    <k name="vscanimagedir"  v="@IMAGEDIR"/>
    <k name="copyimagedir"   v="@IMAGEDIR"/>
    <k name="locale"         v=""/>
    <k name="SaveReportStatistics" v="False"/>
  </k>

  <!-- Standard directory keys -->
  <k name="fingerprint" v="fingerprint"/>
  <k name="export"      v="export"/>

  <!-- Workflow task profiles -->
  <k name="tasks">
    <k name="Scan"     profile="Scan"/>
    <k name="VScan"    profile="ScanFromDisk_MultiFormat"/>
    <k name="Convert"  profile="Convert"/>
    <k name="PageID"   profile="PageID"/>
    <k name="Verify"   profile="Verify"/>
    <k name="Validate" profile="Validate"/>
    <k name="Export"   profile="Export"/>
  </k>

  <!-- Application-level key-value store for smart parameters (@APPVAR) -->
  <!-- Add entries here for any values referenced as @APPVAR(values/gen/KeyName) in rules -->
  <k name="values">
    <k name="gen">
      <!-- Example: <k name="ExportPath" v="@EXPORTDIR"/> -->
    </k>
    <k name="adv">
      <!-- Encrypted secrets go here (set via GUI) -->
    </k>
  </k>

  <!-- Operational flags -->
  <k name="rrslogdir"            v=" "/>
  <k name="BatchNew"             v=""/>
  <k name="QBy"                  v=""/>
  <k name="RoleMode"             v=""/>
  <k name="Authenticator"        v=""/>
  <k name="AutoImportNTGroups"   v="True"/>
  <k name="Audit"                v="True"/>
  <k name="SaveDeletedBatchInfo" v="True"/>
  <k name="InheritJobPriority"   v="False"/>

</app>
