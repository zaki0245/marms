// src/modules/operation/operation.model.ts
// [FUNGSI] Validasi input modul Operation (zod).
// [ALASAN] Data shipment berasal dari form multipart, wajib divalidasi sebelum disimpan.

import { z } from 'zod';

// [FUNGSI] Teks opsional; string kosong dianggap tidak diisi.
const teks = z.string().trim().max(255).nullable().optional();

// [FUNGSI] Skema lengkap satu shipment. | [ALASAN] Satu sumber aturan untuk create & update.
export const shipmentSchema = z.object({
  tb: z.string().trim().min(1, 'TB wajib diisi').max(255),
  bg: z.string().trim().min(1, 'BG wajib diisi').max(255),
  ownerOperator: teks,
  shipper: teks,
  commodities: teks,
  contactMaster: teks,
  laycan: teks,
  pol: z.string().trim().min(1, 'POL wajib diisi').max(255),
  agentPol: teks,
  agentPolId: teks,
  picPol: teks,
  contactAgentPol: teks,
  pod: teks,
  agentPod: teks,
  agentPodId: teks,
  picPod: teks,
  contactAgentPod: teks,
  taPol: z.date().nullable().optional(),
  tbPol: z.date().nullable().optional(),
  slPol: z.date().nullable().optional(),
  clPol: z.date().nullable().optional(),
  coPol: z.date().nullable().optional(),
  tdPol: z.date().nullable().optional(),
  dsPol: z.date().nullable().optional(),
  taPod: z.date().nullable().optional(),
  tbPod: z.date().nullable().optional(),
  sdPod: z.date().nullable().optional(),
  cdPod: z.date().nullable().optional(),
  coPod: z.date().nullable().optional(),
  tdPod: z.date().nullable().optional(),
  dsPod: z.date().nullable().optional(),
  laytimeAllowed: z.number().nonnegative().nullable().optional(),
  dsrPol: z.number().nonnegative().nullable().optional(),
  dsrPod: z.number().nonnegative().nullable().optional(),
  position: teks,
  remarks: z.string().trim().max(1000).nullable().optional(),
  status: z.enum(['PLANNED', 'ON_GOING', 'COMPLETED']),
  latitude: z.number().min(-90, 'Latitude tidak valid').max(90, 'Latitude tidak valid').nullable().optional(),
  longitude: z.number().min(-180, 'Longitude tidak valid').max(180, 'Longitude tidak valid').nullable().optional(),
});

export type ShipmentInput = z.infer<typeof shipmentSchema>;

// [FUNGSI] Validasi master agen pelabuhan (POL/POD).
// [ALASAN] Agen dipakai berulang; nama wajib unik, PIC & kontak opsional.
export const agentSchema = z.object({
  tipe: z.enum(['POL', 'POD']),
  nama: z.string().trim().min(1, 'Nama agen wajib diisi').max(255),
  pic: teks,
  kontak: teks,
});

export type AgentInput = z.infer<typeof agentSchema>;
