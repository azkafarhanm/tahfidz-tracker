export type TahsinMaterialDefault = { jilid: number; startPage: number | null; endPage: number | null };

export const emptyTahsinMaterialDefault: TahsinMaterialDefault = { jilid: 1, startPage: null, endPage: null };

export function resolveTahsinMaterialDefault(latest: TahsinMaterialDefault | null): TahsinMaterialDefault {
  return latest ? { ...latest, endPage: latest.endPage === latest.startPage ? null : latest.endPage } : { ...emptyTahsinMaterialDefault };
}

export function isTahsinSubmitDisabled(isPending: boolean, isLoadingDefault: boolean) {
  return isPending || isLoadingDefault;
}
