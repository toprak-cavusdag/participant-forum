import React from "react";

const KVKKTR = () => {
  return (
    <main className="max-w-4xl mx-auto px-6 py-10 bg-white rounded-lg shadow-md text-gray-800 leading-relaxed">
      <h1 className="text-2xl font-bold text-center mb-6">
        KİŞİSEL VERİLERİN KORUNMASI KANUNU (KVKK) KAPSAMINDA AYDINLATMA METNİ
      </h1>

      <p className="mb-6">
        <strong>Sıfır Atık Vakfı</strong> (“<strong>Vakıf</strong>” veya “<strong>Veri Sorumlusu</strong>”), 6698 sayılı
        Kişisel Verilerin Korunması Kanunu (“<strong>KVKK</strong>”) uyarınca kişisel verilerinizin hukuka uygun olarak
        işlenmesi, saklanması ve gizliliğinizin korunmasına büyük önem vermektedir. Bu Aydınlatma Metni,{" "}
        <strong> Sıfır Atık Forumu</strong> kayıt sürecinde toplanan kişisel verilere ilişkin bilgilendirme amacıyla
        hazırlanmıştır.
      </p>

      <section className="mt-6">
        <h2 className="text-lg font-semibold">1. Veri Sorumlusunun Kimliği</h2>
        <div className="mt-3 rounded-md border p-4 bg-gray-50">
          <dl className="space-y-2">
            <div>
              <dt className="font-medium">Unvan:</dt>
              <dd>Sıfır Atık Vakfı</dd>
            </div>
            <div>
              <dt className="font-medium">Adres:</dt>
              <dd>Kandilli, Hıdrellez Sk. No:3, 34684 Üsküdar/İstanbul</dd>
            </div>
            <div>
              <dt className="font-medium">E-posta:</dt>
              <dd>
                <a href="mailto:secretariat@globalzerowasteforum.org" className="text-emerald-700 underline">
                  secretariat@globalzerowasteforum.org
                </a>
              </dd>
            </div>
            <div>
              <dt className="font-medium">Telefon:</dt>
              <dd>(0216) 651 20 00</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-lg font-semibold">2. İşlenen Kişisel Verileriniz</h2>
        <p className="mt-2">Etkinlik kayıt formu aracılığıyla aşağıdaki kişisel verileriniz işlenmektedir:</p>
        <ul className="list-disc list-inside mt-3 space-y-1">
          <li><strong>Kimlik Bilgileri:</strong> Ad, soyad, doğum tarihi, pasaport numarası, pasaport veriliş ve bitiş tarihi</li>
          <li><strong>İletişim Bilgileri:</strong> E-posta, telefon, ülke kodu</li>
          <li><strong>Mesleki Bilgiler:</strong> Görev/unvan, kurum/kuruluş adı, kurum türü</li>
          <li><strong>Diğer Bilgiler:</strong> Seçilen katılım günleri, ülke, pasaport fotoğrafı, kurum logosu, profil fotoğrafı</li>
        </ul>
      </section>

      <section className="mt-6">
        <h2 className="text-lg font-semibold">3. Kişisel Verilerinizin İşlenme Amaçları</h2>
        <ul className="list-disc list-inside mt-3 space-y-1">
          <li>Etkinlik başvuru ve kayıt süreçlerinin yürütülmesi</li>
          <li>Katılımcı doğrulama ve kimlik kontrolü</li>
          <li>Uluslararası katılımcılar için yasal bildirimlerin yapılması</li>
          <li>İletişim faaliyetleri (bilgilendirme, davet, güncelleme vb.)</li>
          <li>Etkinlik yönetimi, planlama ve organizasyon</li>
          <li>Güvenlik önlemlerinin uygulanması</li>
          <li>Yetkili kamu kurumlarına gerekli bildirimlerin yapılması</li>
          <li>Arşivleme ve raporlama süreçlerinin yürütülmesi</li>
          <li>Katılımcı listelerinin ve etkinlik materyallerinin hazırlanması</li>
        </ul>
      </section>

      <section className="mt-6">
        <h2 className="text-lg font-semibold">4. Toplanma Yöntemi ve Hukuki Sebep</h2>
        <p className="mt-2">
          Verileriniz çevrim içi kayıt formu, e-posta ve benzeri elektronik yollarla toplanır. KVKK madde 5 uyarınca:
        </p>
        <ul className="list-disc list-inside mt-3 space-y-1">
          <li><strong>5/1:</strong> Açık rıza</li>
          <li><strong>5/2-a:</strong> Kanunlarda öngörülmesi</li>
          <li><strong>5/2-e:</strong> Bir hakkın tesisi, kullanılması veya korunması için zorunluluk</li>
          <li><strong>5/2-f:</strong> Meşru menfaatler kapsamında zorunluluk (temel hak ve özgürlüklere zarar vermemek kaydıyla)</li>
        </ul>
      </section>

      <section className="mt-6">
        <h2 className="text-lg font-semibold">5. Kişisel Verilerin Aktarılması</h2>
        <p className="mt-2">Verileriniz aşağıdaki alıcı gruplarıyla paylaşılabilir:</p>
        <ul className="list-disc list-inside mt-3 space-y-1">
          <li>Organizasyon firmaları ve iş ortakları</li>
          <li>Gerekli hâllerde yetkili kamu kurum ve kuruluşları</li>
          <li>Uluslararası etkinlik paydaşları ve konuşmacılar</li>
          <li>Bilişim/hosting hizmet sağlayıcıları</li>
        </ul>
        <p className="mt-3">
          <strong>Yurt dışına aktarım</strong>, açık rızanızla veya KVKK madde 9’daki şartlara uygun şekilde gerçekleştirilir.
        </p>
      </section>

      <section className="mt-6">
        <h2 className="text-lg font-semibold">6. İlgili Kişinin Hakları</h2>
        <p className="mt-2">KVKK madde 11 kapsamında haklarınız:</p>
        <ul className="list-disc list-inside mt-3 space-y-1">
          <li>İşlenip işlenmediğini öğrenme, bilgi talep etme</li>
          <li>Amacına uygun kullanılıp kullanılmadığını öğrenme</li>
          <li>Aktarıldığı üçüncü kişileri bilme</li>
          <li>Eksik/yanlış işlenmişse düzeltilmesini isteme</li>
          <li>Şartları oluştuğunda silinmesini/yok edilmesini isteme</li>
          <li>Bu işlemlerin üçüncü kişilere bildirilmesini isteme</li>
          <li>Otomatik işleme karşı itiraz etme</li>
          <li>Zararın giderilmesini talep etme</li>
        </ul>
      </section>

      <section className="mt-6">
        <h2 className="text-lg font-semibold">7. İletişim</h2>
        <address className="not-italic mt-3 space-y-1">
          <div>
            <span className="font-medium">E-posta: </span>
            <a href="mailto:secretariat@globalzerowasteforum.org" className="text-emerald-700 underline">
              secretariat@globalzerowasteforum.org
            </a>
          </div>
          <div>
            <span className="font-medium">Adres: </span>
            Kandilli, Hıdrellez Sk. No:3, 34684 Üsküdar/İstanbul
          </div>
          <div className="flex items-center">
            <span className="font-medium">Web sitesi: </span>
            <a href="https://sifiratikvakfi.org/" target="_blank" rel="noreferrer" className="text-emerald-700 underline">
              https://sifiratikvakfi.org/
            </a> <div className="mx-2" />
               <a href="https://globalzerowasteforum.org/" target="_blank" rel="noreferrer" className="text-emerald-700 underline">
              https://globalzerowasteforum.org/
            </a>
          </div>
        </address>
      </section>

      <section className="mt-6">
        <h2 className="text-lg font-semibold">8. Açık Rıza Beyanı</h2>
        <p className="mt-2">
          İşbu formda yer alan kişisel verilerimin, belirtilen amaçlar doğrultusunda işlenmesine ve gerekli durumlarda
          yurt içi/yurt dışındaki ilgili üçüncü kişilerle paylaşılmasına <strong>açık rıza veriyorum</strong>.
        </p>
      </section>

      <footer className="mt-8 text-sm text-gray-500">
        Bu metin KVKK gereğince hazırlanmıştır; gerekli durumlarda güncellenebilir.
      </footer>
    </main>
  );
};

export default KVKKTR;
