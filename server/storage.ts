// REMOVIDO no reboot — storage Manus/Forge nao usado.
// Stubs para nao quebrar imports remanescentes.
export async function storagePut(_relKey: string, _data: any, _contentType?: string): Promise<{ key: string; url: string }> {
  throw new Error("storagePut desabilitado no reboot — sem provider de storage configurado.");
}

export async function storageGet(_relKey: string): Promise<{ key: string; url: string }> {
  throw new Error("storageGet desabilitado no reboot — sem provider de storage configurado.");
}
