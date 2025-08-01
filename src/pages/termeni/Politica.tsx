import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function PoliticaPage() {
  const { hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const id = hash.slice(1);
      const el = document.getElementById(id);
      if (el) {
        // Adjust this offset to match your sticky navigation bar's height
        const offset = 96;
        const y = window.pageYOffset + el.getBoundingClientRect().top - offset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    } else {
      // Scroll to the top of the page if no hash is present
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [hash]);

  return (
    <div className="w-full bg-white px-4 lg:px-16 py-12">
      <div className="max-w-4xl mx-auto">
        <header id="privacy-policy" className="text-center space-y-2 mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Politica de Confidențialitate</h1>
          <p className="text-lg text-gray-600">terapie-acasa.ro</p>
          <p className="text-sm text-gray-500">Ultima actualizare: 24 mai 2025</p>
        </header>
        
        <div className="prose prose-lg prose-indigo max-w-none mx-auto space-y-8 text-left">
          <section className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-blue-900 mb-3">Introducere</h2>
            <p className="text-gray-700 leading-relaxed">
              Această politică de confidențialitate explică modul în care Terapie-acasa.ro 
              („Platforma", „noi" sau „ne") colectează, utilizează și protejează informațiile 
              dumneavoastră când utilizați site-ul nostru web și serviciile noastre de terapie online. 
              Această politică se aplică tuturor utilizatorilor platformei noastre și trebuie citită 
              împreună cu Termenii și Condițiile noastre, care conțin informații suplimentare importante 
              despre modul în care gestionăm datele și conținutul dumneavoastră.
            </p>
            <div className="mt-4 p-4 bg-amber-50 border-l-4 border-amber-400">
              <p className="text-sm text-amber-800">
                <strong>Notă importantă pentru servicii medicale:</strong> Datele de sănătate sunt considerate 
                informații sensibile și sunt supuse unor protecții suplimentare conform GDPR și legislației 
                naționale privind protecția datelor medicale.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 text-center">Colectarea și Utilizarea Datelor</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-3">Informațiile pe care le colectăm</h3>
                
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-800 mb-2">Informații de cont</h4>
                    <ul className="list-disc list-inside text-gray-700 space-y-1">
                      <li>Adresa de email</li>
                      <li>Numele complet</li>
                      <li>Numărul de telefon</li>
                      <li>Informații de facturare și plată (procesate prin furnizori terți securizați)</li>
                      <li>Preferințele contului și setările de confidențialitate</li>
                    </ul>
                  </div>

                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <h4 className="font-medium text-red-800 mb-2">Date medicale și de terapie (Informații sensibile)</h4>
                    <ul className="list-disc list-inside text-red-700 space-y-1">
                      <li>Istoricul sesiunilor de terapie și consultațiilor</li>
                      <li>Notele și observațiile terapeutului (cu consimțământul explicit)</li>
                      <li>Mesajele și comunicările din cadrul sesiunilor</li>
                      <li>Informații despre starea de sănătate mintală și obiectivele terapeutice</li>
                      <li>Fișele de evaluare și progresul în terapie</li>
                      <li>Informații despre medicația și alte tratamente (dacă sunt relevante)</li>
                    </ul>
                    <p className="mt-2 text-sm text-red-600">
                      <strong>Protecție specială:</strong> Aceste date sunt clasificate ca informații sensibile 
                      și beneficiază de măsuri de securitate sporite conform reglementărilor medicale.
                    </p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-800 mb-2">Date de utilizare a serviciului</h4>
                    <ul className="list-disc list-inside text-gray-700 space-y-1">
                      <li>Programările și istoricul sesiunilor</li>
                      <li>Datele de interacțiune cu platforma</li>
                      <li>Statistici de utilizare a funcționalităților</li>
                      <li>Jurnalele de erori și informații pentru depanare</li>
                      <li>Feedback-ul și evaluările furnizate</li>
                    </ul>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-800 mb-2">Informații colectate automat</h4>
                    <ul className="list-disc list-inside text-gray-700 space-y-1">
                      <li>Adresele IP (pentru securitate și prevenirea fraudei)</li>
                      <li>Tipul și versiunea browserului</li>
                      <li>Informații despre dispozitiv și sistem de operare</li>
                      <li>Datele și orele de acces</li>
                      <li>Paginile vizitate și căile de navigare</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 text-center">Integrarea cu Google Calendar</h2>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-blue-900 mb-2">Pentru terapeuți</h3>
                  <p className="text-blue-800 mb-3">
                    Platforma noastră oferă integrarea opțională cu Google Calendar pentru a facilita 
                    gestionarea programărilor. Această funcționalitate include:
                  </p>
                  <ul className="list-disc list-inside text-blue-700 space-y-2">
                    <li>
                      <strong>Sincronizare bidirențională:</strong>
                      <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                        <li>Programările din aplicație sunt adăugate automat în Google Calendar</li>
                        <li>Evenimentele din Google Calendar sunt sincronizate cu platforma</li>
                      </ul>
                    </li>
                    <li><strong>Actualizări în timp real:</strong> Modificările și anulările se sincronizează automat</li>
                    <li><strong>Date procesate:</strong> Titlu, dată, oră, durată și participanți</li>
                  </ul>
                </div>

                <div className="bg-white p-4 rounded border">
                  <h4 className="font-medium text-gray-800 mb-2">Controlul și consimțământul</h4>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li>Integrarea este complet opțională și necesită acordul explicit</li>
                    <li>Poate fi dezactivată oricând din setările contului</li>
                    <li>Accesăm doar datele necesare pentru sincronizarea programărilor</li>
                    <li>Nu stocăm informații suplimentare din calendarul Google</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 text-center">Analitice și Cookies</h2>
            
            <div className="space-y-4">
              <p className="text-gray-700">
                Utilizăm instrumente de analiză și cookies pentru a asigura funcționalitatea platformei și a îmbunătăți serviciile:
              </p>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-800 mb-2">Google Analytics</h4>
                  <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
                    <li>Analizează traficul site-ului și comportamentul utilizatorilor</li>
                    <li>Vă puteți dezabona folosind Google Analytics Opt-out Browser Add-on</li>
                    <li>Pentru mai multe informații, vizitați Google Privacy & Terms</li>
                  </ul>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-800 mb-2">Cookies și tehnologii de urmărire</h4>
                  <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
                    <li>Menținerea sesiunii dumneavoastră (cookies esențiale)</li>
                    <li>Memorarea preferințelor (cookies de funcționalitate)</li>
                    <li>Analizarea utilizării platformei (cookies de performanță)</li>
                  </ul>
                  <p className="text-xs text-gray-600 mt-2">
                    Puteți controla preferințele pentru cookies prin setările browserului.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 text-center">Cum utilizăm informațiile dumneavoastră</h2>
            
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h4 className="font-medium text-green-800 mb-2">Furnizarea serviciilor</h4>
                <ul className="list-disc list-inside text-green-700 text-sm space-y-1">
                  <li>Facilitarea sesiunilor de terapie</li>
                  <li>Gestionarea programărilor</li>
                  <li>Îmbunătățirea funcționalității platformei</li>
                  <li>Personalizarea experienței</li>
                </ul>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-800 mb-2">Suport și operațiuni</h4>
                <ul className="list-disc list-inside text-blue-700 text-sm space-y-1">
                  <li>Furnizarea suportului pentru clienți</li>
                  <li>Procesarea plăților</li>
                  <li>Trimiterea actualizărilor de serviciu</li>
                  <li>Comunicarea cu utilizatorii</li>
                </ul>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <h4 className="font-medium text-purple-800 mb-2">Securitate și întreținere</h4>
                <ul className="list-disc list-inside text-purple-700 text-sm space-y-1">
                  <li>Menținerea securității platformei</li>
                  <li>Analizarea tiparelor de utilizare</li>
                  <li>Depanarea problemelor tehnice</li>
                  <li>Prevenirea abuzurilor și fraudei</li>
                </ul>
              </div>
            </div>

            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="font-medium text-red-800 mb-2">Utilizarea datelor medicale</h4>
              <p className="text-red-700 text-sm">
                Datele medicale și de terapie sunt utilizate exclusiv pentru furnizarea serviciilor de terapie, 
                îmbunătățirea calității îngrijirii și respectarea obligațiilor legale. Nu utilizăm aceste informații 
                pentru scopuri de marketing sau publicitare fără consimțământul dumneavoastră explicit și separat.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 text-center">Partajarea și Dezvăluirea Datelor</h2>
            
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-800 mb-2">Furnizori de servicii terți</h4>
                <p className="text-yellow-700 text-sm mb-2">
                  Partajăm datele cu furnizori de încredere, verificați și conformi GDPR, care ne ajută să operăm platforma:
                </p>
                <ul className="list-disc list-inside text-yellow-700 text-sm space-y-1">
                  <li>Procesori de plăți (pentru tranzacții financiare securizate)</li>
                  <li>Servicii de găzduire cloud (cu centre de date în UE)</li>
                  <li>Google (doar pentru funcționalitatea de calendar, cu consimțământul dvs.)</li>
                  <li>Servicii de comunicații (pentru notificări și suport)</li>
                </ul>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-medium text-red-800 mb-2">Obligații legale și de conformitate</h4>
                <p className="text-red-700 text-sm">
                  Putem dezvălui informațiile dumneavoastră în următoarele circumstanțe limitate:
                </p>
                <ul className="list-disc list-inside text-red-700 text-sm space-y-1 mt-2">
                  <li>Pentru a respecta o obligație legală sau o hotărâre judecătorească</li>
                  <li>Pentru a proteja drepturile, proprietatea sau siguranța noastră sau a altora</li>
                  <li>În situații de urgență pentru a preveni vătămarea fizică</li>
                  <li>Conform reglementărilor de raportare medicală obligatorie</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 text-center">Drepturile Dumneavoastră conform GDPR</h2>
            
            <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-indigo-50 p-4 rounded border border-indigo-200">
                  <h4 className="font-medium text-indigo-800">Dreptul de acces</h4>
                  <p className="text-indigo-700 text-sm mt-1">
                    Solicitați o copie a datelor personale pe care le deținem despre dumneavoastră.
                  </p>
                </div>
                
                <div className="bg-indigo-50 p-4 rounded border border-indigo-200">
                  <h4 className="font-medium text-indigo-800">Dreptul la rectificare</h4>
                  <p className="text-indigo-700 text-sm mt-1">
                    Corectarea datelor incorecte sau incomplete.
                  </p>
                </div>
                
                <div className="bg-indigo-50 p-4 rounded border border-indigo-200">
                  <h4 className="font-medium text-indigo-800">Dreptul la ștergere („Dreptul de a fi uitat”)</h4>
                  <p className="text-indigo-700 text-sm mt-1">
                    Solicitarea ștergerii datelor, cu excepția celor pe care avem o obligație legală să le păstrăm.
                  </p>
                </div>
              
                <div className="bg-indigo-50 p-4 rounded border border-indigo-200">
                  <h4 className="font-medium text-indigo-800">Dreptul la portabilitate</h4>
                  <p className="text-indigo-700 text-sm mt-1">
                    Exportarea datelor într-un format structurat și utilizabil.
                  </p>
                </div>
                
                <div className="bg-indigo-50 p-4 rounded border border-indigo-200">
                  <h4 className="font-medium text-indigo-800">Dreptul la restricționarea prelucrării</h4>
                  <p className="text-indigo-700 text-sm mt-1">
                    Limitați modul în care vă prelucrăm datele în anumite circumstanțe.
                  </p>
                </div>

                <div className="bg-indigo-50 p-4 rounded border border-indigo-200">
                  <h4 className="font-medium text-indigo-800">Dreptul de a vă opune</h4>
                  <p className="text-indigo-700 text-sm mt-1">
                    Opuneți-vă prelucrării datelor dumneavoastră în scopuri de marketing direct.
                  </p>
                </div>
            </div>
            
            <div className="mt-6 p-4 bg-green-50 border-l-4 border-green-500">
              <p className="text-green-800 text-sm">
                Pentru exercitarea acestor drepturi, vă rugăm să ne contactați la{' '}
                <a href="mailto:dpo@terapie-acasa.ro" className="text-green-600 hover:underline font-medium">
                  dpo@terapie-acasa.ro
                </a>
                . De asemenea, aveți dreptul de a depune o plângere la Autoritatea Națională de Supraveghere a Prelucrării Datelor cu Caracter Personal (ANSPDCP).
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 text-center">Securitatea Datelor</h2>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-800 mb-2">Măsuri tehnice</h4>
                <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
                  <li>Criptarea datelor în tranzit (SSL/TLS) și în repaus (AES-256)</li>
                  <li>Sisteme de backup securizate și redundante</li>
                  <li>Monitorizarea securității în timp real și alerte de intruziune</li>
                  <li>Controale de acces stricte, bazate pe roluri</li>
                </ul>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-800 mb-2">Măsuri organizatorice</h4>
                <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
                  <li>Formare regulată a personalului privind protecția datelor</li>
                  <li>Audituri de securitate periodice și teste de penetrare</li>
                  <li>Protocoale clare pentru managementul incidentelor de securitate</li>
                  <li>Acorduri de confidențialitate (NDA) cu tot personalul și colaboratorii</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 text-center">Păstrarea Datelor</h2>
            
            <div className="space-y-4">
                <p>Păstrăm datele dumneavoastră personale doar atât timp cât este necesar pentru scopurile pentru care au fost colectate sau pentru a respecta obligațiile legale.</p>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-800 mb-2">Perioade de păstrare</h4>
                <ul className="list-disc list-inside text-blue-700 text-sm space-y-1">
                  <li><strong>Date de cont:</strong> Păstrate pe durata existenței contului și șterse la cererea utilizatorului.</li>
                  <li><strong>Date de facturare:</strong> Păstrate pentru 10 ani, conform legislației fiscale din România.</li>
                  <li><strong>Date medicale/terapie:</strong> Păstrate conform reglementărilor legale în vigoare pentru dosarele medicale, chiar și după închiderea contului, pentru a asigura continuitatea îngrijirii și conformitatea legală.</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 text-center">Confidențialitatea Copiilor</h2>
            
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <p className="text-purple-800">
                Platforma noastră nu se adresează direct persoanelor sub 18 ani. Serviciile pentru minori pot fi accesate doar prin intermediul unui cont creat și gestionat de un părinte sau tutore legal, care își dă consimțământul explicit pentru prelucrarea datelor minorului în scop terapeutic.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 text-center">Modificări ale Politicii</h2>
            
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <p className="text-indigo-800">
                Ne rezervăm dreptul de a actualiza această politică periodic. Vom notifica utilizatorii cu privire la modificările semnificative prin email sau printr-o notificare vizibilă pe platformă, oferind un rezumat al schimbărilor. Continuarea utilizării serviciilor după intrarea în vigoare a modificărilor constituie acceptarea noii politici.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 text-center">Informații de Contact</h2>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <p className="text-green-800 mb-4">
                Dacă aveți întrebări, nelămuriri sau doriți să vă exercitați drepturile privind datele personale, vă rugăm să ne contactați:
              </p>
              <div className="text-green-700 space-y-2">
                <p><strong>Nume platformă:</strong> Terapie-acasa.ro</p>
                <p><strong>Website:</strong> <a href="https://terapie-acasa.ro" className="text-green-600 hover:underline">https://terapie-acasa.ro</a></p>
                <p><strong>Email pentru suport general:</strong> <a href="mailto:contact@terapie-acasa.ro" className="text-green-600 hover:underline">contact@terapie-acasa.ro</a></p>
                <p><strong>Responsabil cu Protecția Datelor (DPO):</strong> <a href="mailto:privacy@terapie-acasa.ro" className="text-green-600 hover:underline">privacy@terapie-acasa.ro</a></p>
                <p><strong>Telefon:</strong> <a href="tel:+40747282997" className="text-green-600 hover:underline">0747 282 997</a></p>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}