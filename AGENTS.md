# Upute za rad u projektu

## GitHub sinkronizacija

- Repozitorij je https://github.com/FlereImsah0/UNICEFcestitka.git, udaljeni repozitorij je `origin`, a zadana grana je `main`.
- Prije rada provjeri status, granu i odredište te dohvati novosti za radnu granu. Kada je radna kopija čista i povijest kompatibilna, povuci ih uz `git pull --ff-only`. Očuvaj sve postojeće lokalne promjene.
- Po završetku zadatka pregledaj razlike i pokreni relevantne provjere. Uključi samo izmjene tog zadatka i izričito navedene korisničke izmjene. Isključi vjerodajnice, lokalne postavke i privremene datoteke. Preskoči commit kad nema izmjena.
- Uskladi se s novim udaljenim commitovima i pošalji dovršeni commit na odgovarajuću granu bez dodatne potvrde za rutinski push. Poštuj zaštitu grane i postojeći tijek s pull requestovima. Izbjegni prisilni push i prepisivanje povijesti.
- Nakon pusha provjeri udaljenu granu i u izvještaju navedi granu i commit. Ako slanje zapne, riješi što možeš i navedi konkretan preostali uvjet. Izmjene izvan Codexa obuhvati kada ih korisnik uključi u zadatak.

## DeployMonster

- Projekt: UNICEF Božićna potvrda, `prj_37115de3ecfa3568eef6a868695f29a9`.
- Produkcijski naziv domene: `cestitka.fleresjourney.com`.
- Statička aplikacija nalazi se u `dist/` i pokreće se bez izgradnje. Pri objavi spakiraj sadržaj `dist/` tako da je `index.html` u korijenu ZIP datoteke.
- Za buduće objave upotrijebi isti projekt i izvornu reviziju iz `.deploymonster.json`. Nakon potvrđene objave ažuriraj vezu i reviziju. Izostavi vezu projekta iz javnog paketa.
