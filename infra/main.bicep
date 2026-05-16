// ============================================================================
// Nexory — Infraestructura Azure (Bicep)
// ISP Management System
// ============================================================================

// ---------------------------------------------------------------------------
// Parámetros
// ---------------------------------------------------------------------------

@description('Nombre del entorno (dev, prod)')
param environmentName string = 'dev'

@description('Región de Azure para la mayoría de recursos')
param location string = resourceGroup().location

@description('Región para PostgreSQL')
param dbLocation string = 'eastus2'

@secure()
@description('Contraseña del administrador de PostgreSQL')
param dbAdminPassword string

@description('Usuario administrador de PostgreSQL')
param dbAdminUser string = 'nexoryadmin'

@description('Nombre de la base de datos')
param dbName string = 'nexory_db'

@secure()
@description('Clave secreta para JWT')
param jwtSecret string

@description('URL del frontend (para CORS)')
param frontendUrl string = 'https://nexory-frontend.azurestaticapps.net'

// ---------------------------------------------------------------------------
// Variables
// ---------------------------------------------------------------------------

var postgresServerName    = 'nexory-pg-${environmentName}'
var containerAppEnvName   = 'nexory-cae-${environmentName}'
var backendAppName        = 'nexory-backend-${environmentName}'
var acrName               = 'nexoryacr${environmentName}'
var logAnalyticsName      = 'nexory-log-${environmentName}'

// ---------------------------------------------------------------------------
// Log Analytics
// ---------------------------------------------------------------------------

resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: logAnalyticsName
  location: location
  properties: {
    sku: { name: 'PerGB2018' }
    retentionInDays: 30
  }
}

// ---------------------------------------------------------------------------
// Azure Container Registry
// ---------------------------------------------------------------------------

resource acr 'Microsoft.ContainerRegistry/registries@2023-07-01' = {
  name: acrName
  location: location
  sku: { name: 'Basic' }
  properties: { adminUserEnabled: true }
}

// ---------------------------------------------------------------------------
// Container App Environment
// ---------------------------------------------------------------------------

resource containerAppEnv 'Microsoft.App/managedEnvironments@2023-05-01' = {
  name: containerAppEnvName
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalytics.properties.customerId
        sharedKey: logAnalytics.listKeys().primarySharedKey
      }
    }
  }
}

// ---------------------------------------------------------------------------
// PostgreSQL Flexible Server
// ---------------------------------------------------------------------------

resource postgresServer 'Microsoft.DBforPostgreSQL/flexibleServers@2022-12-01' = {
  name: postgresServerName
  location: dbLocation
  sku: {
    name: 'Standard_B1ms'
    tier: 'Burstable'
  }
  properties: {
    version: '16'
    administratorLogin: dbAdminUser
    administratorLoginPassword: dbAdminPassword
    authConfig: {
      activeDirectoryAuth: 'Disabled'
      passwordAuth: 'Enabled'
    }
    storage: { storageSizeGB: 32 }
    backup: {
      backupRetentionDays: 7
      geoRedundantBackup: 'Disabled'
    }
    highAvailability: { mode: 'Disabled' }
  }
}

// ---------------------------------------------------------------------------
// Base de datos
// ---------------------------------------------------------------------------

resource postgresDatabase 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2022-12-01' = {
  parent: postgresServer
  name: dbName
  properties: {
    charset: 'UTF8'
    collation: 'en_US.utf8'
  }
}

// ---------------------------------------------------------------------------
// Firewall — permitir servicios de Azure
// ---------------------------------------------------------------------------

resource postgresFirewall 'Microsoft.DBforPostgreSQL/flexibleServers/firewallRules@2022-12-01' = {
  parent: postgresServer
  name: 'AllowAzureServices'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

// ---------------------------------------------------------------------------
// Backend — Container App (Node.js + Express)
// Se despliega desde deploy.sh después del build de Docker
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Outputs
// ---------------------------------------------------------------------------

output acrLoginServer       string = acr.properties.loginServer
output acrName              string = acr.name
output postgresHost         string = postgresServer.properties.fullyQualifiedDomainName
output containerAppEnvName  string = containerAppEnv.name
output backendAppName       string = backendAppName
