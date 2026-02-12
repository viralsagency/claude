# BLE Scale App

App React Native (Expo) per la lettura di bilance Bluetooth Low Energy (BLE).

## Funzionalità

- **Scansione BLE** - Ricerca automatica di bilance compatibili nelle vicinanze
- **Lettura peso** - Ricezione dati di peso in tempo reale dalla bilancia
- **Composizione corporea** - Supporto per massa grassa, massa muscolare, acqua corporea, BMI, massa ossea, metabolismo basale
- **Cronologia** - Salvataggio automatico delle misurazioni con storico consultabile
- **Profilo utente** - Configurazione altezza, età e sesso per calcoli accurati

## Protocolli BLE supportati

- Weight Scale Service (UUID `0x181D`) - Standard Bluetooth SIG
- Body Composition Service (UUID `0x181B`) - Standard Bluetooth SIG
- Generic Weight Service (UUID `0xFFE0`) - Bilance generiche

## Bilance compatibili

Compatibile con bilance che implementano i profili standard Bluetooth, tra cui:
Xiaomi Mi Scale, Yunmai, Eufy, Renpho, Withings, Fitindex, Arboleaf, Etekcity, Wyze, Garmin, Omron, Tanita, QardioBase e altre.

## Setup

```bash
npm install
npx expo prebuild
npx expo run:android  # oppure run:ios
```

> **Nota**: L'app richiede un development build (non Expo Go) per il supporto BLE.

## Struttura progetto

```
src/
├── components/     # Componenti UI riutilizzabili
├── hooks/          # Custom hooks (useBle)
├── navigation/     # Configurazione navigazione
├── screens/        # Schermate dell'app
├── services/       # BLE service layer
├── storage/        # AsyncStorage persistence
├── theme/          # Colori, spacing, tipografia
└── types/          # TypeScript types
```
