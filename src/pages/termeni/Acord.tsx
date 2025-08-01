import React from 'react';

export default function DataProcessingAgreementPage() {
  React.useEffect(() => {
    if (window.location.hash) {
      const id = window.location.hash.slice(1);
      const el = document.getElementById(id);
      if (el) {
        const offset = 96;
        const y = window.pageYOffset + el.getBoundingClientRect().top - offset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }
  }, []);

  return (
    <div className="bg-white py-6 sm:py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <header className="text-center mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold tracking-tight text-gray-900 font-serif mb-3 sm:mb-4">
            Acord de Prelucrare a Datelor
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-gray-600 mb-2">
            Conform Art. 28 din Regulamentul General privind Protecția Datelor (GDPR)
          </p>
          <p className="text-sm sm:text-base lg:text-lg text-gray-600 mb-2">
            Pentru Servicii de Terapie și Consiliere Psihologică
          </p>
          <p className="text-xs sm:text-sm text-gray-400 mb-4">
            Ultima actualizare: 29 iulie 2025
          </p>
          
          {/* Contact Information Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 text-center">
            <h3 className="font-semibold text-blue-900 mb-2 text-sm sm:text-base">Contact pentru Protecția Datelor</h3>
            <p className="text-xs sm:text-sm text-blue-800">
              Email: <a href="mailto:privacy@terapie-acasa.ro" className="underline">privacy@terapie-acasa.ro</a><br/>
              Telefon: +40 747 282 997<br/>
              Adresă: Str. Mica 207 E Cod 547185, Sat Cristesti, Mures
            </p>
          </div>
        </header>

        <div className="prose prose-sm sm:prose-base lg:prose-lg prose-indigo max-w-none mx-auto text-center">
          
          {/* Important Healthcare Notice */}
          <div className="bg-amber-50 border-l-4 border-amber-400 p-4 sm:p-6 mb-6 sm:mb-8 text-left">
            <div className="flex">
              <div className="ml-3">
                <p className="text-xs sm:text-sm text-amber-700">
                  <strong>ATENȚIE IMPORTANTĂ:</strong> Acest acord reglementează prelucrarea datelor cu caracter personal în contextul serviciilor de terapie și consiliere psihologică. Datele despre sănătate sunt considerate categorii speciale de date personale conform GDPR și beneficiază de protecție suplimentară.
                </p>
              </div>
            </div>
          </div>

          <h2 id="1" className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">1. Părțile Contractante și Domeniul de Aplicare</h2>
          <p className="mb-4 sm:mb-6 text-sm sm:text-base">
            Acest Acord de Prelucrare a Datelor („Acordul") este încheiat între operatorul platformei <strong>terapie-acasa.ro</strong> („Controlorul de Date" sau „Platforma") și orice furnizor terț de servicii tehnice („Procesatorul de Date" sau „Furnizorul") care oferă servicii ce implică prelucrarea de date cu caracter personal în numele Controlorului.
          </p>
          <p className="mb-4 sm:mb-6 text-sm sm:text-base">
            Prezentul acord face parte integrantă din Acordul de Prestări Servicii și se aplică exclusiv prelucrării datelor cu caracter personal în contextul serviciilor de terapie, consiliere psihologică și activități conexe oferite prin platformă.
          </p>

          <h2 id="2" className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">2. Definiții</h2>
          <div className="text-left mb-4 sm:mb-6">
            <ul className="space-y-2 text-sm sm:text-base">
              <li><strong>Date cu Caracter Personal:</strong> Orice informație privind o persoană fizică identificată sau identificabilă.</li>
              <li><strong>Date despre Sănătate:</strong> Date cu caracter personal referitoare la sănătatea fizică sau mentală a unei persoane fizice, inclusiv informații despre serviciile de sănătate.</li>
              <li><strong>Date de Client:</strong> Toate datele cu caracter personal prelucrate de Procesator în numele Controlorului în legătură cu serviciile de terapie.</li>
              <li><strong>Persoană Vizată:</strong> Clientul, terapeutul sau orice altă persoană ale cărei date personale sunt prelucrate.</li>
              <li><strong>Sub-procesator:</strong> Orice terț angajat de Procesator pentru prelucrarea datelor în numele Controlorului.</li>
              <li><strong>Incident de Securitate:</strong> Orice încălcare a securității care duce la distrugerea, pierderea, alterarea, divulgarea neautorizată sau accesul neautorizat la datele personale.</li>
            </ul>
          </div>

          <h2 id="3" className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">3. Obiectul și Durata Prelucrării</h2>
          <p className="mb-3 sm:mb-4 text-sm sm:text-base">
            Obiectul acestui acord constă în reglementarea condițiilor în care Procesatorul va prelucra datele cu caracter personal, inclusiv datele despre sănătate, în conformitate cu instrucțiunile documentate ale Controlorului și cu respectarea strictă a confidențialității medicale.
          </p>
          <p className="mb-4 sm:mb-6 text-sm sm:text-base">
            Durata prelucrării este legată de perioada contractuală a serviciului prestat și se extinde până la 90 de zile după încetarea serviciilor pentru a permite ștergerea securizată a datelor, cu excepția cazurilor în care legea impune o perioadă mai lungă de retenție.
          </p>

          <h2 id="4" className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">4. Natura, Scopul și Operațiunile de Prelucrare</h2>
          <p className="mb-3 sm:mb-4 text-sm sm:text-base">
            Prelucrarea datelor este necesară pentru furnizarea serviciilor de terapie și consiliere psihologică prin intermediul platformei digitale, inclusiv:
          </p>
          <div className="text-left mb-4 sm:mb-6">
            <ul className="space-y-1 sm:space-y-2 text-sm sm:text-base">
              <li>• Găzduirea și funcționarea platformei de terapie online</li>
              <li>• Programarea și gestionarea sesiunilor de terapie</li>
              <li>• Facilitarea comunicării securizate între terapeut și client</li>
              <li>• Procesarea plăților pentru serviciile de terapie</li>
              <li>• Trimiterea de notificări și comunicări legate de servicii</li>
              <li>• Păstrarea jurnalelor de securitate și audit</li>
              <li>• Backup-ul și restaurarea datelor în scopuri de continuitate</li>
            </ul>
          </div>

          <h2 id="5" className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">5. Tipuri de Date și Categorii de Persoane Vizate</h2>
          
          <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3">5.1 Categorii de Persoane Vizate:</h3>
          <div className="text-left mb-3 sm:mb-4">
            <ul className="space-y-1 text-sm sm:text-base">
              <li>• Clienți care solicită servicii de terapie și consiliere</li>
              <li>• Terapeuți și consilieri psihologi înregistrați pe platformă</li>
              <li>• Reprezentanți legali ai minorilor (cu consimțământul adecvat)</li>
              <li>• Personal administrativ al platformei</li>
              <li>• Contacte de urgență desemnate de clienți</li>
            </ul>
          </div>

          <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3">5.2 Tipuri de Date Prelucrate:</h3>
          <div className="text-left mb-3 sm:mb-4">
            <h4 className="font-medium mb-2 text-sm sm:text-base">Date de Identificare și Contact:</h4>
            <ul className="ml-3 sm:ml-4 space-y-1 mb-3 sm:mb-4 text-sm sm:text-base">
              <li>• Nume, prenume, data nașterii</li>
              <li>• Adresă de email, număr de telefon</li>
              <li>• Adresă de corespondență</li>
              <li>• Fotografii de profil (opțional)</li>
            </ul>

            <h4 className="font-medium mb-2 text-sm sm:text-base">Date despre Sănătate și Servicii Medicale:</h4>
            <ul className="ml-3 sm:ml-4 space-y-1 mb-3 sm:mb-4 text-sm sm:text-base">
              <li>• Istoricul sesiunilor de terapie și consiliere</li>
              <li>• Note și observații terapeutice</li>
              <li>• Planuri de tratament și obiective terapeutice</li>
              <li>• Evaluări psihologice și teste de screening</li>
              <li>• Informații despre medicația psihiatrică (dacă relevante)</li>
              <li>• Rapoarte de progres și rezultate</li>
            </ul>

            <h4 className="font-medium mb-2 text-sm sm:text-base">Date Tehnice și de Utilizare:</h4>
            <ul className="ml-3 sm:ml-4 space-y-1 mb-4 sm:mb-6 text-sm sm:text-base">
              <li>• Adrese IP și informații de dispozitiv</li>
              <li>• Jurnale de activitate și timestamp-uri</li>
              <li>• Preferințe de utilizare și setări</li>
              <li>• Date de autentificare și securitate</li>
            </ul>
          </div>

          <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3">5.3 Date Interzise:</h3>
          <p className="mb-4 sm:mb-6 text-sm sm:text-base">
            Procesatorul nu va prelucra date care depășesc scopul serviciilor de terapie, inclusiv: informații financiare detaliate (în afara celor necesare pentru plăți), date biometrice, date despre orientarea sexuală (în afara contextului terapeutic relevant), sau orice alte date sensibile care nu sunt necesare pentru furnizarea serviciilor de consiliere psihologică.
          </p>

          <h2 id="6" className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">6. Obligațiile Procesatorului de Date</h2>
          <div className="text-left mb-4 sm:mb-6">
            <p className="mb-3 sm:mb-4 text-sm sm:text-base">Procesatorul se obligă să:</p>
            
            <h3 className="font-semibold mb-2 text-sm sm:text-base">6.1 Conformitate cu Instrucțiunile:</h3>
            <ul className="ml-3 sm:ml-4 space-y-1 sm:space-y-2 mb-3 sm:mb-4 text-sm sm:text-base">
              <li>• Prelucrează datele exclusiv pe baza instrucțiunilor documentate ale Controlorului</li>
              <li>• Notifică imediat Controlorul dacă consideră că o instrucțiune încalcă legislația aplicabilă</li>
              <li>• Poate refuza executarea instrucțiunilor care ar putea compromite securitatea sau legalitatea prelucrării</li>
            </ul>

            <h3 className="font-semibold mb-2 text-sm sm:text-base">6.2 Confidențialitate și Securitate:</h3>
            <ul className="ml-3 sm:ml-4 space-y-1 sm:space-y-2 mb-3 sm:mb-4 text-sm sm:text-base">
              <li>• Asigură că personalul autorizat să acceseze datele s-a angajat la confidențialitate</li>
              <li>• Implementează măsuri tehnice și organizatorice adecvate pentru protecția datelor</li>
              <li>• Utilizează criptarea AES-256 pentru datele stocate și TLS 1.3+ pentru transmisii</li>
              <li>• Mențin backup-uri criptate cu replicare geografică</li>
              <li>• Efectuează audituri de securitate trimestriale</li>
            </ul>

            <h3 className="font-semibold mb-2 text-sm sm:text-base">6.3 Gestionarea Încidentelor:</h3>
            <ul className="ml-3 sm:ml-4 space-y-1 sm:space-y-2 mb-3 sm:mb-4 text-sm sm:text-base">
              <li>• Notifică orice incident de securitate în maxim 24 de ore (pentru date despre sănătate)</li>
              <li>• Furnizează toate informațiile disponibile despre incident</li>
              <li>• Cooperează pentru investigarea și remedierea incidentului</li>
              <li>• Documentează toate incidentele și măsurile corective</li>
            </ul>

            <h3 className="font-semibold mb-2 text-sm sm:text-base">6.4 Suport pentru Drepturile Persoanelor Vizate:</h3>
            <ul className="ml-3 sm:ml-4 space-y-1 sm:space-y-2 mb-4 sm:mb-6 text-sm sm:text-base">
              <li>• Asistă Controlorul în exercitarea drepturilor persoanelor vizate în maxim 72 de ore</li>
              <li>• Redirecționează solicitările primite direct către Controlorul de date</li>
              <li>• Furnizează toate datele necesare pentru răspunsul către persoana vizată</li>
            </ul>
          </div>

          <h2 id="7" className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">7. Măsuri Tehnice și Organizatorice de Securitate</h2>
          <div className="text-left mb-4 sm:mb-6">
            <h3 className="font-semibold mb-2 text-sm sm:text-base">7.1 Măsuri Tehnice:</h3>
            <ul className="ml-3 sm:ml-4 space-y-1 sm:space-y-2 mb-3 sm:mb-4 text-sm sm:text-base">
              <li>• Criptarea end-to-end pentru comunicațiile sensibile dintre terapeut și client</li>
              <li>• Sisteme de autentificare multi-factor pentru toate conturile administrative</li>
              <li>• Monitorizarea continuă a sistemelor pentru detectarea anomaliilor</li>
              <li>• Backup automatizat cu testare regulată a procedurilor de recuperare</li>
              <li>• Segregarea rețelei și izolarea sistemelor critice</li>
              <li>• Scanarea regulată pentru vulnerabilități și actualizări de securitate</li>
            </ul>

            <h3 className="font-semibold mb-2 text-sm sm:text-base">7.2 Măsuri Organizatorice:</h3>
            <ul className="ml-3 sm:ml-4 space-y-1 sm:space-y-2 mb-4 sm:mb-6 text-sm sm:text-base">
              <li>• Politici de control al accesului bazate pe principiul necesității de a cunoaște</li>
              <li>• Instruirea regulată a personalului privind protecția datelor medicale</li>
              <li>• Proceduri documentate pentru gestionarea incidentelor</li>
              <li>• Revizuirea periodică a accesurilor și privilegiilor</li>
              <li>• Contracte de confidențialitate pentru tot personalul cu acces la date</li>
            </ul>
          </div>

          <h2 id="8" className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">8. Sub-procesatori</h2>
          <p className="mb-3 sm:mb-4 text-sm sm:text-base">
            Procesatorul poate angaja sub-procesatori pentru îndeplinirea obligațiilor contractuale, cu respectarea următoarelor condiții:
          </p>
          <div className="text-left mb-3 sm:mb-4">
            <ul className="ml-3 sm:ml-4 space-y-1 sm:space-y-2 mb-3 sm:mb-4 text-sm sm:text-base">
              <li>• Obținerea consimțământului scris prealabil de la Controlorul de date</li>
              <li>• Impunerea acelorași obligații de protecție prin contract</li>
              <li>• Menținerea unei liste actualizate a sub-procesatorilor pe website</li>
              <li>• Notificarea cu 14 zile înainte de orice modificare a listei</li>
            </ul>
          </div>
          
          <h3 className="font-semibold mb-2 text-sm sm:text-base">8.1 Sub-procesatori Aprobați Curent:</h3>
          <div className="bg-gray-50 p-3 sm:p-4 rounded-lg mb-4 sm:mb-6">
            <ul className="space-y-1 sm:space-y-2 text-sm sm:text-base">
              <li>• <strong>Supabase:</strong> Găzduirea bazei de date și autentificare</li>
              <li>• <strong>Google Cloud:</strong> Servicii de calendar și OAuth</li>
              <li>• <strong>Resend:</strong> Servicii de email tranzacțional</li>
              <li>• <strong>Stripe:</strong> Procesarea plăților securizate</li>
            </ul>
            <p className="text-xs sm:text-sm text-gray-600 mt-2">
              Lista completă și actualizată este disponibilă la: <a href="https://terapie-acasa.ro/subprocessors" className="underline">terapie-acasa.ro/subprocessors</a>
            </p>
          </div>

          <h2 id="9" className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">9. Transferuri Internaționale de Date</h2>
          <p className="mb-3 sm:mb-4 text-sm sm:text-base">
            Orice transfer de date în afara Spațiului Economic European va fi efectuat cu respectarea garanțiilor adecvate:
          </p>
          <div className="text-left mb-4 sm:mb-6">
            <ul className="ml-3 sm:ml-4 space-y-1 sm:space-y-2 text-sm sm:text-base">
              <li>• Utilizarea Clauzelor Contractuale Standard aprobate de Comisia Europeană</li>
              <li>• Implementarea măsurilor suplimentare de protecție pentru datele despre sănătate</li>
              <li>• Evaluarea impactului transferului asupra drepturilor persoanelor vizate</li>
              <li>• Monitorizarea continuă a legislației locale din țara de destinație</li>
              <li>• Suspendarea transferurilor în cazul în care garanțiile devin inadecvate</li>
            </ul>
          </div>

          <h2 id="10" className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">10. Drepturile de Audit și Inspecție</h2>
          <p className="mb-3 sm:mb-4 text-sm sm:text-base">
            Controlorul are dreptul de a audita respectarea prezentului acord în următoarele condiții:
          </p>
          <div className="text-left mb-4 sm:mb-6">
            <ul className="ml-3 sm:ml-4 space-y-1 sm:space-y-2 text-sm sm:text-base">
              <li>• Preaviz de minimum 30 de zile pentru audituri la locația Procesatorului</li>
              <li>• Maxim un audit pe an, cu excepția cazurilor de incident de securitate</li>
              <li>• Auditurile pot fi efectuate de către Controlorul sau un auditor independent</li>
              <li>• Procesatorul va furniza documentația necesară și accesul la sistemele relevante</li>
              <li>• Costurile auditului sunt suportate de Controlorul, cu excepția cazurilor de neconformitate</li>
              <li>• Rapoarte SOC 2 Type 2 actuale pot fi acceptate în locul auditurilor directe</li>
            </ul>
          </div>

          <h2 id="11" className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">11. Notificarea Incidentelor de Securitate</h2>
          <div className="text-left mb-4 sm:mb-6">
            <h3 className="font-semibold mb-2 text-sm sm:text-base">11.1 Procedura de Notificare:</h3>
            <ul className="ml-3 sm:ml-4 space-y-1 sm:space-y-2 mb-3 sm:mb-4 text-sm sm:text-base">
              <li>• Notificare inițială în maxim 24 de ore pentru datele despre sănătate</li>
              <li>• Raport detaliat în maxim 72 de ore de la descoperirea incidentului</li>
              <li>• Actualizări regulate pe parcursul investigației</li>
              <li>• Raport final cu analiza cauzelor și măsurile preventive</li>
            </ul>

            <h3 className="font-semibold mb-2 text-sm sm:text-base">11.2 Conținutul Notificării:</h3>
            <ul className="ml-3 sm:ml-4 space-y-1 sm:space-y-2 mb-4 sm:mb-6 text-sm sm:text-base">
              <li>• Natura și gravitatea incidentului</li>
              <li>• Categoriile și numărul aproximativ de persoane afectate</li>
              <li>• Tipurile de date compromiese</li>
              <li>• Consecințele probabile ale incidentului</li>
              <li>• Măsurile luate pentru limitarea impactului</li>
              <li>• Recomandări pentru Controlorul de date</li>
            </ul>
          </div>

          <h2 id="12" className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">12. Returnarea și Ștergerea Datelor</h2>
          <p className="mb-3 sm:mb-4 text-sm sm:text-base">
            La încetarea serviciilor, Procesatorul va proceda după cum urmează:
          </p>
          <div className="text-left mb-4 sm:mb-6">
            <ul className="ml-3 sm:ml-4 space-y-1 sm:space-y-2 text-sm sm:text-base">
              <li>• Întreruperea imediată a prelucrării, cu excepția stocării securizate</li>
              <li>• Returnarea sau ștergerea datelor în maxim 30 de zile conform instrucțiunilor</li>
              <li>• Ștergerea din sistemele active în maxim 90 de zile</li>
              <li>• Ștergerea din backup-uri în maxim 365 de zile</li>
              <li>• Furnizarea unei confirmări scrise a ștergerii complete</li>
              <li>• Păstrarea doar a datelor necesare pentru respectarea obligațiilor legale</li>
            </ul>
          </div>

          <h2 id="13" className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">13. Obligațiile Controlorului de Date</h2>
          <div className="text-left mb-4 sm:mb-6">
            <p className="mb-3 sm:mb-4 text-sm sm:text-base">Controlorul se obligă să:</p>
            <ul className="ml-3 sm:ml-4 space-y-1 sm:space-y-2 text-sm sm:text-base">
              <li>• Furnizeze instrucțiuni clare și legale pentru prelucrarea datelor</li>
              <li>• Obțină consimțământurile necesare de la persoanele vizate</li>
              <li>• Informeze persoanele vizate despre prelucrarea datelor</li>
              <li>• Coopereze pentru răspunsul la solicitările persoanelor vizate</li>
              <li>• Notifice autoritatea de supraveghere în cazul incidentelor grave</li>
              <li>• Să nu furnizeze date interzise sau irelevante pentru scopul declarat</li>
            </ul>
          </div>

          <h2 id="14" className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">14. Răspunderea și Limitarea Daunelor</h2>
          <p className="mb-3 sm:mb-4 text-sm sm:text-base">
            Părțile sunt răspunzătoare pentru daunele cauzate de încălcarea prezentului Acord sau a reglementărilor de protecție a datelor, cu următoarele precizări:
          </p>
          <div className="text-left mb-4 sm:mb-6">
            <ul className="ml-3 sm:ml-4 space-y-1 sm:space-y-2 text-sm sm:text-base">
              <li>• Răspunderea totală nu va depăși valoarea contractului de servicii pe 12 luni</li>
              <li>• Pentru datele despre sănătate, se aplică o răspundere sporită conform Art. 82 GDPR</li>
              <li>• Excluderea răspunderii pentru daune indirecte, cu excepția neglijenței grave</li>
              <li>• Asigurarea responsabilității civile profesionale de minimum 1.000.000 EUR</li>
            </ul>
          </div>

          <h2 id="15" className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">15. Modificări și Actualizări</h2>
          <p className="mb-4 sm:mb-6 text-sm sm:text-base">
            Prezentul acord poate fi modificat doar prin acordul scris al ambelor părți, cu excepția adaptărilor necesare pentru conformitatea cu modificările legislative, care vor fi notificate cu 30 de zile înainte de intrarea în vigoare.
          </p>

          <h2 id="16" className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">16. Legea Aplicabilă și Jurisdicția</h2>
          <p className="mb-3 sm:mb-4 text-sm sm:text-base">
            Acest acord este guvernat de legislația Uniunii Europene și a României. Pentru litigiile referitoare la:
          </p>
          <div className="text-left mb-4 sm:mb-6">
            <ul className="ml-3 sm:ml-4 space-y-1 sm:space-y-2 text-sm sm:text-base">
              <li>• <strong>Protecția datelor:</strong> jurisdicția exclusivă a instanțelor din Cluj-Napoca</li>
              <li>• <strong>Aspecte medicale:</strong> Colegiul Psihologilor din România are competență disciplinară</li>
              <li>• <strong>Alte aspecte contractuale:</strong> instanțele competente din Cluj-Napoca</li>
            </ul>
          </div>

          <h2 id="17" className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">17. Autoritatea de Supraveghere</h2>
          <p className="mb-4 sm:mb-6 text-sm sm:text-base">
            Autoritatea Națională de Supraveghere a Prelucrării Datelor cu Caracter Personal (ANSPDCP) este autoritatea competentă pentru supravegherea aplicării prezentului acord pe teritoriul României.
          </p>

          <h2 id="18" className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">18. Contact și Informații Suplimentare</h2>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6">
            <h3 className="font-semibold text-blue-900 mb-3 text-sm sm:text-base">Pentru întrebări privind acest Acord:</h3>
            <div className="text-left text-blue-800">
              <p className="text-sm sm:text-base"><strong>Responsabilul cu Protecția Datelor (DPO):</strong></p>
              <ul className="ml-3 sm:ml-4 space-y-1 mb-3 sm:mb-4 text-xs sm:text-sm">
                <li>Email: <a href="mailto:privacy@terapie-acasa.ro" className="underline">privacy@terapie-acasa.ro</a></li>
                <li>Telefon: +40 747 282 997</li>
                <li>Adresă: Str. Mica 207 E Cod 547185, Sat Cristesti, Mures</li>
              </ul>
              
              <p className="text-sm sm:text-base"><strong>Contact General:</strong></p>
              <ul className="ml-3 sm:ml-4 space-y-1 text-xs sm:text-sm">
                <li>Email: <a href="mailto:contact@terapie-acasa.ro" className="underline">contact@terapie-acasa.ro</a></li>
                <li>Website: <a href="https://terapie-acasa.ro" className="underline">terapie-acasa.ro</a></li>
              </ul>
            </div>
          </div>

          {/* Signature Section */}
          <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-gray-200">
            <h3 className="text-base sm:text-lg font-semibold mb-4 sm:mb-6">Semnături</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
              <div className="text-left">
                <h4 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Pentru Controlorul de Date:</h4>
                <div className="space-y-2 text-sm sm:text-base">
                  <p>Nume: _________________________</p>
                  <p>Funcția: _____________________</p>
                  <p>Data: _______________________</p>
                  <p>Semnătura: __________________</p>
                </div>
              </div>
              <div className="text-left">
                <h4 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Pentru Procesatorul de Date:</h4>
                <div className="space-y-2 text-sm sm:text-base">
                  <p>Nume: _________________________</p>
                  <p>Funcția: _____________________</p>
                  <p>Data: _______________________</p>
                  <p>Semnătura: __________________</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Notice */}
          <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200 text-xs sm:text-sm text-gray-600">
            <p>
              Prin utilizarea serviciilor platformei terapie-acasa.ro, Compania acceptă să fie legată de termenii acestui Acord de Prelucrare a Datelor.
            </p>
          </div>
          
        </div>
      </div>
    </div>
  );
}







// // Headers
// "text-4xl" → "text-2xl sm:text-3xl lg:text-4xl xl:text-5xl"
// "text-2xl" → "text-lg sm:text-xl lg:text-2xl" 
// "text-lg" → "text-base sm:text-lg"

// // Body text
// "text-base" → "text-sm sm:text-base"
// "text-sm" → "text-xs sm:text-sm"

// // Spacing
// "py-12" → "py-6 sm:py-12"
// "mb-6" → "mb-4 sm:mb-6"
// "p-4" → "p-3 sm:p-4"

// // Lists
// "ml-4" → "ml-3 sm:ml-4"

// // Prose
// "prose-lg" → "prose-sm sm:prose-base lg:prose-lg"