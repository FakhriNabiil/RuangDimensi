import axiosInstance from './axiosInstance';

export async function listAssets({ category, search, sort } = {}) {
  const params = {};
  if (category) params.category = category;
  if (search) params.search = search;
  if (sort) params.sort = sort;

  const res = await axiosInstance.get('/api/assets', { params });
  return res.data.data;
}

export async function getAsset(assetId) {
  const res = await axiosInstance.get(`/api/assets/${assetId}`);
  return res.data.data;
}

export async function getMyAssets() {
  const res = await axiosInstance.get('/api/my-assets');
  return res.data.data;
}

// File yang diizinkan untuk diunggah sebagai file 3D, beserta MIME type yang sesuai.
const THREED_MIME_BY_EXTENSION = {
  glb: 'model/gltf-binary',
  fbx: 'application/octet-stream',
  obj: 'application/octet-stream'
};

function coerce3dFileType(file) {
  if (!file) return file;
  const ext = file.name.split('.').pop()?.toLowerCase();
  const targetType = THREED_MIME_BY_EXTENSION[ext] || 'application/octet-stream';
  if (file.type === targetType) return file;
  return new File([file], file.name, { type: targetType });
}

function buildAssetFormData(fields, files) {
  const formData = new FormData();
  formData.append('NamaAset', fields.NamaAset);
  formData.append('Deskripsi', fields.Deskripsi ?? '');
  formData.append('Kategori', fields.Kategori);
  formData.append('HargaJuta', String(fields.HargaJuta));
  if (files?.thumbnail) formData.append('thumbnail', files.thumbnail);
  if (files?.file3D) formData.append('file3d', coerce3dFileType(files.file3D));
  return formData;
}

export async function createAsset(fields, files) {
  const formData = buildAssetFormData(fields, files);
  const res = await axiosInstance.post('/api/assets', formData);
  return res.data.data;
}

export async function updateAsset(assetId, fields, files) {
  const formData = buildAssetFormData(fields, files);
  const res = await axiosInstance.put(`/api/assets/${assetId}`, formData);
  return res.data.data;
}

export async function deleteAsset(assetId) {
  const res = await axiosInstance.delete(`/api/assets/${assetId}`);
  return res.data.data;
}
