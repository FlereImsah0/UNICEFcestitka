# UNICEFcestitka

Generator božićnih potvrda o donaciji za UNICEF Hrvatska. Osobni podaci i učitane slike obrađuju se u pregledniku.

## Lokalno pokretanje

Iz korijena projekta pokrenite `python -m http.server 8146 --bind 127.0.0.1 --directory dist` pa otvorite [lokalnu aplikaciju](http://127.0.0.1:8146/). Izrada aplikacije i poslužiteljski kod nisu potrebni.

Pristupni zaslon pamti otključavanje u kartici za vrijeme sesije. Kod se provjerava u pregledniku i služi kao osnovna prepreka pri otvaranju. Za stvarno ograničen pristup koristite kontrolu pristupa na hostingu. Oznaka `noindex, nofollow` traži od tražilica da ne indeksiraju stranicu.

## Izvoz

PNG se izvozi s 12 px/mm (304,8 dpi), a PDF s točnim dimenzijama odabranog formata. Za tisak u punoj veličini odaberite 100 % u programu za ispis. Ispis do ruba ovisi o postavkama i mogućnostima pisača.

Pristupni zaslon i potvrda koriste priloženi hrvatski UNICEF logotip s prozirnom pozadinom. Fontovi i biblioteke uključuju pripadajuće licence.
