"""Odstraní modré pozadí z portrétu (chroma key + souvislé oblasti od okrajů) a uloží PNG s průhledností."""
import sys
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

vstup, vystup = sys.argv[1], sys.argv[2]
img = Image.open(vstup).convert('RGB')
a = np.asarray(img).astype(np.int16)
r, g, b = a[..., 0], a[..., 1], a[..., 2]
h, w = r.shape
yy = np.arange(h)[:, None].repeat(w, 1)

modre = (b - np.maximum(r, g) > 16)
svetle_modre = (b > 165) & (b - r > 14) & (np.abs(r - g) < 25)
kandidat = (modre | svetle_modre) & (yy < int(h * 0.70))   # pod ramenem už je oblek, ten nechat
kandidat = ndimage.binary_opening(kandidat, iterations=2)
stitky, n = ndimage.label(kandidat)
okraj = set(np.unique(np.concatenate([stitky[0, :], stitky[:int(h * 0.7), 0], stitky[:int(h * 0.7), -1]]))) - {0}
pozadi = np.isin(stitky, list(okraj))
pozadi = ndimage.binary_fill_holes(pozadi) if False else pozadi
pozadi = ndimage.binary_closing(pozadi, iterations=3)
alfa = np.where(pozadi, 0, 255).astype(np.uint8)
alfa_img = Image.fromarray(alfa).filter(ImageFilter.GaussianBlur(3))
# měkké zmizení u levého, pravého a horního okraje (odstraní linky na hranách fotky)
xx = np.arange(w)[None, :].repeat(h, 0)
rampa = np.clip(np.minimum(np.minimum(xx, w - 1 - xx), yy) / 60.0, 0, 1)
alfa_img = Image.fromarray((np.asarray(alfa_img).astype(np.float32) * rampa).astype(np.uint8))
vysledek = img.copy(); vysledek.putalpha(alfa_img)
vysledek.save(vystup, optimize=True)
print('ulozeno', vystup, f'{w}x{h}', 'pozadi %.0f %%' % (pozadi.mean() * 100))
