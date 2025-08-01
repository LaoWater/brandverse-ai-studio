import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Navigation from "@/components/Navigation";


export default function TermeniPage() {
  const { hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const id = hash.slice(1);
      const el = document.getElementById(id);
      if (el) {
        const offset = 96; // adjust this to match your nav height
        const y = window.pageYOffset + el.getBoundingClientRect().top - offset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }
  }, [hash]);

  return (
    
    <div className="w-full px-4 lg:px-16 py-8">
        {/* <Navigation /> */}

      {/* Termeni și Condiții */}
      <header id="terms" className="text-center space-y-1 mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Termeni și Condiții</h1>
        <p className="text-lg text-gray-700">de Utilizare a Platformei terapie-acasa.ro</p>
        <p className="text-sm text-gray-500">Ultima actualizare: 10 Mai 2025</p>
      </header>
      
      <div className="max-w-4xl mx-auto">
        <article className="prose prose-lg prose-indigo max-w-none text-center space-y-8">
          
          <section className="border-b border-gray-200 pb-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Introducere</h2>
            <div className="text-left space-y-4">
              <p>
                Acești termeni constituie un acord legal între dumneavoastră și operatorul platformei 
                <strong> terapie-acasa.ro</strong> ("Platforma", "noi" sau "nouă"). Utilizarea site-ului 
                terapie-acasa.ro și a serviciilor disponibile pe platformă ("Serviciile") este supusă 
                acestor Termeni și Condiții ("Termenii").
              </p>
              <p>
                <strong>Prin utilizarea Platformei și a oricăror Servicii, dumneavoastră:</strong>
              </p>
              <ul className="text-left">
                <li>Recunoașteți că ați citit și înțeles acești Termeni</li>
                <li>Sunteți de acord să fiți obligat de acești Termeni</li>
                <li>Sunteți de acord cu <a href="/politica" className="text-indigo-600 hover:underline">Politica noastră de Confidențialitate</a></li>
                <li>Vă angajați să respectați toate legile și reglementările aplicabile</li>
              </ul>
            </div>
          </section>

          <section className="border-b border-gray-200 pb-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Definiții și Terminologie</h2>
            <div className="text-left space-y-3">
              <div>
                <strong>Platforma</strong> – serviciul online operat prin{' '}
                <a href="https://terapie-acasa.ro" className="text-indigo-600 hover:underline">
                  terapie-acasa.ro
                </a>, incluzând toate funcționalitățile, interfețele și serviciile conexe.
              </div>
              <div>
                <strong>Utilizator/Client</strong> – orice persoană fizică ce accesează și utilizează 
                serviciile platformei pentru a primi consiliere psihologică sau terapie.
              </div>
              <div>
                <strong>Terapeut/Specialist</strong> – profesionist licențiat în psihologie, psihoterapie 
                sau consiliere psihologică, autorizat conform legislației române, înregistrat pe platformă.
              </div>
              <div>
                <strong>Servicii Terapeutice</strong> – consultații de sănătate mintală oferite prin 
                platformă, incluzând terapie individuală, consiliere psihologică și servicii conexe.
              </div>
              <div>
                <strong>Sesiune</strong> – orice interacțiune terapeutică programată între client și 
                terapeut, prin video, audio sau mesagerie.
              </div>
              <div>
                <strong>Conținut Generat de Utilizator</strong> – orice informații, mesaje, documente 
                sau date transmise prin platformă.
              </div>
            </div>
          </section>

          <section className="border-b border-gray-200 pb-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Natura și Obiectul Serviciului</h2>
            <div className="text-left space-y-4">
              <p>
                Platforma facilitează accesul la servicii profesionale de sănătate mintală prin 
                conectarea clienților cu terapeuți licențiați. Serviciile includ:
              </p>
              <ul>
                <li>Terapie individuală prin video, audio și mesagerie</li>
                <li>Consiliere psihologică specializată</li>
                <li>Suport pentru sănătate mintală și bunăstare emoțională</li>
                <li>Planuri de tratament personalizate</li>
                <li>Monitorizarea progresului terapeutic</li>
              </ul>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-semibold text-red-800 mb-2">AVERTISMENTE IMPORTANTE:</h3>
                <ul className="text-red-700 space-y-1">
                  <li><strong>NU oferim servicii de urgență psihiatrică sau intervenții în criză</strong></li>
                  <li><strong>NU înlocuim tratamentul medical de urgență</strong></li>
                  <li><strong>În caz de urgență sau gânduri suicidare, sunați IMEDIAT la 112</strong></li>
                  <li><strong>Pentru criză psihologică, contactați: Telefonul de Suflet 0800.801.200</strong></li>
                </ul>
              </div>
            </div>
          </section>

          <section className="border-b border-gray-200 pb-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Eligibilitate și Condiții de Acces</h2>
            <div className="text-left space-y-4">
              <p><strong>Pentru a utiliza serviciile, trebuie să îndepliniți următoarele condiții:</strong></p>
              <ul>
                <li><strong>Vârsta minimă de 18 ani</strong> sau consimțământul părinților/tutorilor legali pentru minori</li>
                <li>Capacitate de exercițiu deplină (nu sunteți sub tutelă sau interdicție legală)</li>
                <li>Acces la internet stabil și dispozitiv compatibil</li>
                <li>Furnizarea de informații exacte și complete la înregistrare</li>
                <li>Consimțământul informat pentru primirea serviciilor de terapie</li>
                <li>Înțelegerea și acceptarea limitărilor serviciilor online</li>
              </ul>
              
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h3 className="font-semibold text-amber-800 mb-2">Restricții de Acces:</h3>
                <p className="text-amber-700">
                  Serviciile noastre nu sunt potrivite pentru persoanele cu tulburări psihiatrice acute, 
                  dependențe severe active, sau cele care necesită supraveghere medicală constantă. 
                  În aceste cazuri, recomandăm consultarea unui psihiatru sau internarea într-o 
                  instituție specializată.
                </p>
              </div>
            </div>
          </section>

          <section className="border-b border-gray-200 pb-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Licența de Utilizare</h2>
            <div className="text-left space-y-4">
              <p>
                Sub rezerva respectării acestor Termeni, vă acordăm o licență limitată, personală, 
                non-exclusivă, non-transferabilă pentru utilizarea Serviciilor noastre. Această 
                licență include dreptul de a accesa și utiliza platforma pentru primirea de servicii 
                terapeutice conforme cu abonamentul dumneavoastră.
              </p>
              
              <h3 className="font-semibold text-gray-800">Restricții de utilizare:</h3>
              <ul>
                <li>Nu puteți transfera, vinde sau licenția accesul la alte persoane</li>
                <li>Nu puteți utiliza platforma pentru scopuri comerciale fără acordul nostru</li>
                <li>Nu puteți copia, modifica sau distribui conținutul platformei</li>
                <li>Nu puteți circumventa măsurile de securitate</li>
              </ul>
            </div>
          </section>

          <section className="border-b border-gray-200 pb-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Drepturile de Proprietate Intelectuală</h2>
            <div className="text-left space-y-4">
              <h3 className="font-semibold text-gray-800">Drepturile noastre:</h3>
              <p>Deținem și păstrăm toate drepturile asupra:</p>
              <ul>
                <li>Marcii "terapie-acasa.ro" și elementelor de brand</li>
                <li>Arhitecturii și designului platformei</li>
                <li>Algoritmilor proprietari și sistemelor</li>
                <li>Interfețelor utilizator și funcționalităților</li>
                <li>Documentației și materialelor de suport</li>
                <li>Conținutului site-ului web și materialelor de marketing</li>
              </ul>
              
              <h3 className="font-semibold text-gray-800">Drepturile dumneavoastră:</h3>
              <p>Păstrați proprietatea completă asupra:</p>
              <ul>
                <li>Informațiilor personale și medicale partajate</li>
                <li>Conținutului generat în timpul sesiunilor</li>
                <li>Jurnalelor personale și exercițiilor completate</li>
                <li>Oricăror materiale create sau dezvoltate de dumneavoastră</li>
              </ul>
            </div>
          </section>

          <section className="border-b border-gray-200 pb-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Confidențialitate și Protecția Datelor</h2>
            <div className="text-left space-y-4">
              <p>
                <strong>Protejăm datele dumneavoastră conform GDPR (UE) 2016/679 și Legii nr. 190/2018 
                privind măsurile de protecție a persoanelor fizice cu privire la prelucrarea datelor 
                cu caracter personal.</strong>
              </p>
              
              <h3 className="font-semibold text-gray-800">Date colectate și procesate:</h3>
              <ul>
                <li>Date de identificare și contact (nume, email, telefon)</li>
                <li>Informații despre starea de sănătate mintală (cu consimțământ explicit)</li>
                <li>Istoricul sesiunilor și comunicărilor</li>
                <li>Date de facturare și plată</li>
                <li>Preferințe de programare și disponibilitate</li>
                <li>Feedback și evaluări</li>
              </ul>
              
              <h3 className="font-semibold text-gray-800">Măsuri de securitate:</h3>
              <ul>
                <li>Criptare end-to-end pentru toate comunicările</li>
                <li>Stocare securizată în centre de date certificate</li>
                <li>Acces restricționat pe baza de nevoi</li>
                <li>Audit regulat de securitate</li>
                <li>Backup securizat și disaster recovery</li>
              </ul>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-700">
                  <strong>Drepturile dumneavoastră:</strong> Puteți solicita accesul, rectificarea, 
                  ștergerea sau portabilitatea datelor. Pentru exercitarea drepturilor, consultați{' '}
                  <a href="/politica" className="text-indigo-600 hover:underline">
                    Politica de Confidențialitate
                  </a> sau contactați-ne la{' '}
                  <a href="mailto:privacy@terapie-acasa.ro" className="text-indigo-600 hover:underline">
                    privacy@terapie-acasa.ro
                  </a>.
                </p>
              </div>
            </div>
          </section>

          <section className="border-b border-gray-200 pb-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Relația Terapeut–Client și Responsabilități</h2>
            <div className="text-left space-y-4">
              <h3 className="font-semibold text-gray-800">Statutul terapeuților:</h3>
              <ul>
                <li>Terapeuții sunt profesioniști independenți, licențiați conform legii române</li>
                <li>Fiecare terapeut își asumă responsabilitatea pentru serviciile oferite</li>
                <li>Verificăm licențele și calificările la înregistrare</li>
                <li>Monitorizăm respectarea standardelor profesionale</li>
              </ul>
              
              <h3 className="font-semibold text-gray-800">Responsabilitățile platformei:</h3>
              <ul>
                <li>Facilitarea conexiunii între clienți și terapeuți</li>
                <li>Asigurarea funcționalității tehnice a platformei</li>
                <li>Protecția datelor și confidențialității</li>
                <li>Suportul tehnic pentru utilizatori</li>
                <li>Monitorizarea respectării termenilor</li>
              </ul>
              
              <h3 className="font-semibold text-gray-800">Limitări:</h3>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-gray-700">
                  <strong>Platforma NU răspunde pentru:</strong> conținutul specific al sesiunilor, 
                  deciziile terapeutice, metodele de tratament utilizate, rezultatele terapiei sau 
                  acțiunile întreprinse de terapeuți în afara platformei.
                </p>
              </div>
            </div>
          </section>

          <section className="border-b border-gray-200 pb-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Comportamentul Utilizatorilor și Conduita Acceptabilă</h2>
            <div className="text-left space-y-4">
              <h3 className="font-semibold text-gray-800">Clienții se angajează să:</h3>
              <ul>
                <li>Trateze cu respect terapeuții și personalul platformei</li>
                <li>Furnizeze informații exacte și complete</li>
                <li>Respecte programările sau să anuleze cu minim 24 ore înainte</li>
                <li>Utilizeze platforma doar pentru scopurile destinate</li>
                <li>Mențină confidențialitatea informațiilor despre alți utilizatori</li>
                <li>Respecte drepturile de proprietate intelectuală</li>
              </ul>
              
              <h3 className="font-semibold text-gray-800">Comportamente interzise:</h3>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <ul className="text-red-700 space-y-1">
                  <li>Hărțuirea, amenințarea sau intimidarea altor utilizatori</li>
                  <li>Partajarea de conținut ilegal, obscen sau prejudiciabil</li>
                  <li>Tentativele de fraudă sau înșelăciune</li>
                  <li>Utilizarea platformei pentru activități ilegale</li>
                  <li>Încercarea de a accesa conturi sau date ale altor utilizatori</li>
                  <li>Spamming sau trimiterea de mesaje nesolicitate</li>
                  <li>Utilizarea de limbaj discriminatoriu sau hate speech</li>
                  <li>Încercarea de a compromite securitatea platformei</li>
                </ul>
              </div>
              
              <p className="text-center font-medium text-gray-700">
                <strong>Încălcarea acestor reguli poate duce la suspendarea temporară sau permanentă a contului.</strong>
              </p>
            </div>
          </section>

          <section className="border-b border-gray-200 pb-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Servicii și Prețuri</h2>
            <div className="text-left space-y-4">
              <h3 className="font-semibold text-gray-800">Planuri disponibile:</h3>
              <ul>
                <li>Consultații individuale (tarif pe sesiune)</li>
                <li>Pachete de sesiuni cu discount</li>
                <li>Abonamente săptămânale sau lunare</li>
                <li>Carduri Cadou</li>
                <li>Servicii premium cu funcționalități adiționale</li>
              </ul>

              
              <h3 className="font-semibold text-gray-800">Politica de preturi:</h3>
              <ul>
                <li>Toate tarifele sunt afișate în RON, inclusiv TVA</li>
                <li>Prețurile pot fi actualizate cu notificare prealabilă de 30 zile</li>
                <li>Abonamentele active nu sunt afectate de schimbările de preț</li>
                <li>Oferte și promoții speciale pot avea termeni și condiții suplimentare</li>
              </ul>
              
              <h3 className="font-semibold text-gray-800">Servicii de suport:</h3>
              <p>Oferim suport tehnic prin:</p>
              <ul>
                <li>Email: <a href="mailto:support@terapie-acasa.ro" className="text-indigo-600 hover:underline">support@terapie-acasa.ro</a></li>
                <li>Chat live în timpul programului de lucru</li>
                <li>Ghiduri și întrebări frecvente</li>
                <li>Tutorial video pentru utilizarea platformei</li>
              </ul>
            </div>
          </section>

          <section className="border-b border-gray-200 pb-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Termeni de Plată și Facturare</h2>
            <div className="text-left space-y-4">
              <h3 className="font-semibold text-gray-800">Modalități de plată:</h3>
              <ul>
                <li>Card bancar (Visa, Mastercard, American Express)</li>
                <li>Transfer bancar</li>
                <li>Plata online prin procesatori certificați</li>
                <li>Plata în rate (pentru anumite pachete)</li>
              </ul>
              
              <h3 className="font-semibold text-gray-800">Politica de facturare:</h3>
              <ul>
                <li>Plata în avans pentru sesiunile programate</li>
                <li>Facturare automată pentru abonamente recurente</li>
                <li>Emiterea facturilor fiscale conforme legislației române</li>
                <li>Notificări de plată cu 7 zile înainte de scadența</li>
              </ul>
              
              <h3 className="font-semibold text-gray-800">Politica de anulare și rambursare:</h3>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <ul className="text-amber-700 space-y-2">
                  <li><strong>Anulări cu ≥24 ore înainte:</strong> Sesiunea poate fi reprogramată fără cost</li>
                  <li><strong>Anulări cu &lt;24 ore înainte:</strong> Sesiunea se poate considera efectuată, decizia fiind luată de Terapeut</li>
                  <li><strong>No-show:</strong> Sesiunea se taxează integral</li>
                  <li><strong>Rambursări:</strong> Doar în cazuri justificate medicală sau probleme tehnice majore</li>
                  <li><strong>Abonamente:</strong> Pot fi anulate cu efecte de la următoarea perioadă de facturare</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="border-b border-gray-200 pb-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Conturi de Utilizator și Gestionarea Datelor</h2>
            <div className="text-left space-y-4">
              <h3 className="font-semibold text-gray-800">Crearea și gestionarea contului:</h3>
              <ul>
                <li>Înregistrarea necesită email valid și informații complete</li>
                <li>Sunteți responsabil pentru securitatea contului și parolei</li>
                <li>Notificați-ne imediat în caz de acces neautorizat</li>
                <li>Un utilizator poate avea un singur cont activ</li>
              </ul>
              
              <h3 className="font-semibold text-gray-800">Ștergerea contului și a datelor:</h3>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-700">
                  <strong>Dreptul la ștergere:</strong> Puteți solicita ștergerea completă a contului 
                  și a tuturor datelor istorice prin accesarea secțiunii "Profil → Ștergere cont" 
                  din platforma. Această acțiune este ireversibilă și va elimina:
                </p>
                <ul className="text-green-700 mt-2">
                  <li>Toate informațiile personale și de contact</li>
                  <li>Istoricul complet al sesiunilor</li>
                  <li>Mesajele și comunicările</li>
                  <li>Datele de facturare (păstrate doar pentru conformitatea fiscală)</li>
                  <li>Preferințele și setările contului</li>
                </ul>
                <p className="text-green-700 mt-2">
                  <strong>Timp de procesare:</strong> Ștergerea se efectuează în maxim 30 zile de la solicitare.
                </p>
              </div>
            </div>
          </section>

          <section className="border-b border-gray-200 pb-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Suspendarea și Rezilierea Contului</h2>
            <div className="text-left space-y-4">
              <h3 className="font-semibold text-gray-800">Motive pentru suspendare:</h3>
              <ul>
                <li>Încălcarea termenilor Și condițiilor</li>
                <li>Comportament inadecvat față de terapeuți sau personal</li>
                <li>Activități fraudulente sau ilegale</li>
                <li>Nerespectarea repetată a programărilor</li>
                <li>Furnizarea de informații false</li>
              </ul>
              
              <h3 className="font-semibold text-gray-800">Procesul de suspendare:</h3>
              <ul>
                <li>Avertisment prealabil (în cazuri non-critice)</li>
                <li>Notificare prin email cu motivația</li>
                <li>Posibilitatea de a contesta decizia în 15 zile</li>
                <li>Suspendare temporară (1-30 zile) sau permanentă</li>
              </ul>
              
              <h3 className="font-semibold text-gray-800">Rezilierea voluntară:</h3>
              <p>
                Puteți închide contul oricând prin:
              </p>
              <ul>
                <li>Opțiunea "Ștergere cont" din profil</li>
                <li>Email la <a href="mailto:contact@terapie-acasa.ro" className="text-indigo-600 hover:underline">contact@terapie-acasa.ro</a></li>
                <li>Solicitare telefonică la <a href="tel:+40747282997" className="text-indigo-600 hover:underline">0747 282 997</a></li>
              </ul>
            </div>
          </section>

          <section className="border-b border-gray-200 pb-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Utilizări Interzise</h2>
            <div className="text-left space-y-4">
              <p><strong>Este strict interzis să utilizați platforma pentru:</strong></p>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <ul className="text-red-700 space-y-1">
                  <li>Reverse engineering sau încercarea de a copia platforma</li>
                  <li>Utilizarea de instrumente automate, boți sau scripturi</li>
                  <li>Accesarea neautorizată a datelor altor utilizatori</li>
                  <li>Distribuirea de malware, viruși sau cod malițios</li>
                  <li>Crearea de conturi multiple pentru a circumventi limitările</li>
                  <li>Revinderea accesului la platformă fără autorizație</li>
                  <li>Utilizarea pentru activități ilegale sau frauduloase</li>
                  <li>Încercarea de a supraîncărca sau compromite sistemele</li>
                  <li>Colectarea neautorizată de date despre utilizatori</li>
                  <li>Utilizarea pentru training AI sau machine learning fără consimțământ</li>
                </ul>
              </div>
              
              <p className="text-center font-medium text-gray-700">
                Platforma nu poate fi utilizată niciodată pentru activități supuse sancțiunilor 
                internaționale sau care încalcă legile jurisdicției în care operăm.
              </p>
            </div>
          </section>

          <section className="border-b border-gray-200 pb-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Limitarea Răspunderii și Exonerări</h2>
            <div className="text-left space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-800 mb-2">EXONERARE DE GARANȚII:</h3>
                <p className="text-yellow-700 text-sm">
                  UTILIZAREA PLATFORMEI, SERVICIILOR ȘI CONȚINUTULUI ESTE PE PROPRIUL DUMNEAVOASTRĂ RISC. 
                  PLATFORMA, SERVICIILE ȘI CONȚINUTUL SUNT FURNIZATE "ASA CUM SUNT" ȘI "DUPĂ DISPONIBILITATE" 
                  FĂRĂ NICIO GARANȚIE. ÎN MĂSURA MAXIMĂ PERMISĂ DE LEGE, EXONERĂM TOATE GARANȚIILE, 
                  EXPRESE SAU IMPLICITE, INCLUSIV GARANȚIILE DE VANDABILITATE, ADECVARE PENTRU UN SCOP 
                  PARTICULAR ȘI NEÎNCĂLCARE.
                </p>
              </div>
              
              <h3 className="font-semibold text-gray-800">Nu răspundem pentru:</h3>
              <ul>
                <li>Eficacitatea sau rezultatele specifice ale terapiei</li>
                <li>Deciziile sau acțiunile terapeuților independenți</li>
                <li>Conținutul generat în timpul sesiunilor</li>
                <li>Pierderi de date cauzate de probleme tehnice externe</li>
                <li>Întreruperi temporare ale serviciului</li>
                <li>Acțiuni ale utilizatorilor în afara platformei</li>
                <li>Schimbări în starea de sănătate mintală</li>
                <li>Decizii luate pe baza informațiilor primite în terapie</li>
              </ul>
              
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-2">Limitarea daunelor:</h4>
                <p className="text-gray-700 text-sm">
                  ÎN NICIUN CAZ RĂSPUNDEREA NOASTRĂ TOTALĂ PENTRU ORICE DAUNE NU VA DEPĂȘI SUMA 
                  PLĂTITĂ DE DUMNEAVOASTRĂ PENTRU SERVICII ÎN ULTIMELE 12 LUNI PRECEDENTE RECLAMAȚIEI. 
                  ACEASTĂ LIMITARE SE APLICĂ INDIFERENT DE TEORIA JURIDICĂ PE CARE SE BAZEAZĂ RECLAMAȚIA.
                </p>
              </div>
            </div>
          </section>

          <section className="border-b border-gray-200 pb-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">15. Indemnizarea</h2>
            <div className="text-left space-y-4">
              <p>
                Sunteți de acord să ne apărați, să ne despăgubiți și să ne exonerați, împreună cu 
                directorii, angajații, agenții și reprezentanții noștri, de orice reclamații, 
                răspunderi, daune sau cheltuieli (inclusiv onorariile rezonabile de avocat) 
                care rezultă din:
              </p>
              <ul>
                <li>Utilizarea platformei și serviciilor noastre</li>
                <li>Încălcarea acestor Termeni</li>
                <li>Încălcarea drepturilor terților</li>
                <li>Conținutul pe care îl transmiteți prin serviciile noastre</li>
                <li>Orice reclamații legate de serviciile terapeutice primite</li>
                <li>Utilizarea neautorizată a contului dumneavoastră</li>
              </ul>
            </div>
          </section>

          <section className="border-b border-gray-200 pb-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">16. Proprietatea Intelectuală și DMCA</h2>
            <div className="text-left space-y-4">
              <h3 className="font-semibold text-gray-800">Respectarea drepturilor de autor:</h3>
              <p>
                Respectăm drepturile de proprietate intelectuală și ne conformăm cu legislația 
                română și internațională privind drepturile de autor.
              </p>
              
              <h3 className="font-semibold text-gray-800">Raportarea încălcărilor:</h3>
              <p>Pentru raportarea încălcărilor de drepturi de autor, contactați-ne la 
              <a href="mailto:legal@terapie-acasa.ro" className="text-indigo-600 hover:underline"> legal@terapie-acasa.ro</a> cu:</p>
              <ul>
                <li>Identificarea lucrării protejate prin drepturi de autor</li>
                <li>Identificarea materialului pretins a încălca drepturile</li>
                <li>Informațiile dumneavoastră de contact</li>
                <li>O declarație de bună credință privind încălcarea</li>
                <li>O declarație de acuratețe sub jurământ</li>
              </ul>
            </div>
          </section>

          <section className="border-b border-gray-200 pb-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">17. Modificări ale Termenilor</h2>
            <div className="text-left space-y-4">
              <p>
                Ne rezervăm dreptul de a modifica acești Termeni în orice moment. Modificările 
                vor fi comunicate prin:
              </p>
              <ul>
                <li>Notificare prin email cu 30 zile înainte</li>
                <li>Anunț vizibil pe platformă</li>
                <li>Actualizarea datei "Ultima actualizare"</li>
              </ul>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-700">
                  <strong>Continuarea utilizării</strong> platformei după intrarea în vigoare a 
                  modificărilor constituie acceptarea noilor termeni. Dacă nu sunteți de acord 
                  cu modificările, puteți închide contul înainte de intrarea lor în vigoare.
                </p>
              </div>
            </div>
          </section>

          <section className="border-b border-gray-200 pb-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">18. Legea Aplicabilă și Jurisdicția</h2>
            <div className="text-left space-y-4">
              <p>
                <strong>Acești Termeni sunt guvernați de legislația română.</strong> Orice dispută 
                legată de acești Termeni sau utilizarea platformei va fi soluționată de instanțele 
                competente din România.
              </p>
              
              <h3 className="font-semibold text-gray-800">Soluționarea disputelor:</h3>
              <ul>
                <li><strong>Mediere:</strong> Încurajăm soluționarea prin mediere înainte de acțiuni judiciare</li>
                <li><strong>Jurisdicția:</strong> Instanțele din Cluj-Napoca pentru disputele civile</li>
                <li><strong>Legea aplicabilă:</strong> Codul Civil român și legislația relevantă în materie</li>
              </ul>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 mb-2">Soluționarea alternativă:</h4>
                <p className="text-green-700">
                  Pentru conflicte minore, oferim un sistem intern de soluționare a disputelor. 
                  Contactați <a href="mailto:contact@terapie-acasa.ro" className="text-indigo-600 hover:underline">contact@terapie-acasa.ro </a> 
                   pentru asistență în rezolvarea problemelor.
                </p>
              </div>
            </div>
          </section>

          <section className="border-b border-gray-200 pb-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">19. Promoții și Feedback</h2>
            <div className="text-left space-y-4">
              <h3 className="font-semibold text-gray-800">Promoții și oferte speciale:</h3>
              <ul>
                <li>Putem oferi promoții, concursuri sau campanii speciale</li>
                <li>Acestea pot avea termeni și condiții suplimentare</li>
                <li>Participarea este opțională și guvernată de reguli specifice</li>
                <li>Ne rezervăm dreptul de a modifica sau anula promoțiile</li>
              </ul>
              
              <h3 className="font-semibold text-gray-800">Feedback și sugestii:</h3>
              <ul>
                <li>Apreciem feedback-ul pentru îmbunătățirea serviciilor</li>
                <li>Putem implementa sugestiile fără compensații</li>
                <li>Furnizarea feedback-ului ne acordă o licență perpetuă de utilizare</li>
                <li>Nu datorăm credite sau compensații pentru sugestiile implementate</li>
              </ul>
            </div>
          </section>

          <section className="border-b border-gray-200 pb-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">20. Contacte și Informații Legale</h2>
            <div className="text-left space-y-4">
              <h3 className="font-semibold text-gray-800">Pentru întrebări generale:</h3>
              <ul>
                <li>Email: <a href="mailto:contact@terapie-acasa.ro" className="text-indigo-600 hover:underline">contact@terapie-acasa.ro</a></li>
                <li>Telefon: <a href="tel:+40747282997" className="text-indigo-600 hover:underline">0747 282 997</a></li>
                <li>Program: Luni-Vineri, 09:00-18:00</li>
              </ul>
              
              <h3 className="font-semibold text-gray-800">Pentru probleme specifice:</h3>
              <ul>
                <li><strong>Suport tehnic:</strong> <a href="mailto:contact@terapie-acasa.ro" className="text-indigo-600 hover:underline">contact@terapie-acasa.ro</a></li>
                <li><strong>Protecția datelor:</strong> <a href="mailto:privacy@terapie-acasa.ro" className="text-indigo-600 hover:underline">privacy@terapie-acasa.ro</a></li>
                <li><strong>Aspecte legale:</strong> <a href="mailto:legal@terapie-acasa.ro" className="text-indigo-600 hover:underline">legal@terapie-acasa.ro</a></li>
                <li><strong>Dispute:</strong> <a href="mailto:contact@terapie-acasa.ro" className="text-indigo-600 hover:underline">contact@terapie-acasa.ro</a></li>
                <li><strong>Facturare:</strong> <a href="mailto:contact@terapie-acasa.ro" className="text-indigo-600 hover:underline">contact@terapie-acasa.ro</a></li>
              </ul>
              
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-2">Informații despre operator:</h4>
                <p className="text-gray-700 text-sm">
                  Operator: PURPOSE TRY SRL <br />
                  Sediul: Str. Mica 207 E Cod 547185, Sat Cristesti, Mures<br />
                  CUI: 43526816<br />
                  Nr. reg. com.: J26/21/2021<br />
                </p>
              </div>
            </div>
          </section>

          <section className="pb-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">21. Confirmarea Acceptării</h2>
            <div className="text-left space-y-4">
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
                <h3 className="font-semibold text-indigo-800 mb-3">Declarație de Acceptare</h3>
                <p className="text-indigo-700 mb-4">
                  Prin continuarea utilizării platformei <strong>terapie-acasa.ro</strong>, 
                  confirmați în mod expres că:
                </p>
                <ul className="text-indigo-700 space-y-2">
                  <li>✓ Ați citit în întregime acești Termeni și Condiții</li>
                  <li>✓ Înțelegeți și acceptați toate prevederile menționate</li>
                  <li>✓ Vă angajați să respectați toate obligațiile stabilite</li>
                  <li>✓ Recunoașteți limitările și exonerările de răspundere</li>
                  <li>✓ Acceptați jurisdicția și legea aplicabilă română</li>
                  <li>✓ Înțelegeți natura serviciilor de terapie online oferite</li>
                </ul>
                
                <div className="mt-4 p-3 bg-white rounded border border-indigo-300">
                  <p className="text-indigo-800 font-medium text-sm">
                    <strong>Data ultimei actualizări:</strong> 10 Mai 2025<br />
                    <strong>Versiunea documentului:</strong> 2.0<br />
                    <strong>Validitate:</strong> Acești termeni rămân în vigoare până la o eventuală actualizare viitoare
                  </p>
                </div>
              </div>
              
              <p className="text-center text-gray-600 font-medium mt-6">
                Pentru orice clarificări suplimentare, nu ezitați să ne contactați la 
                <a href="mailto:contact@terapie-acasa.ro" className="text-indigo-600 hover:underline"> contact@terapie-acasa.ro</a>
              </p>
            </div>
          </section>
        </article>
      </div>
    </div>
  );
}