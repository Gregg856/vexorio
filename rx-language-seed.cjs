'use strict';
// RX LANGUAGE SEED — manually verified public UI labels from index.html i18n.
// No user listings, accounts, messages, or private data. This is vocabulary, NOT chat training.
const LANGUAGES=Object.freeze(['pl','de','en','uk']);
const ENTRIES=Object.freeze([
 {id:'search',pl:'Szukaj',de:'Suchen',en:'Search',uk:'Пошук'},
 {id:'free',pl:'Darmowe ogłoszenia',de:'Kostenlose Anzeigen',en:'Free listings',uk:'Безкоштовні оголошення'},
 {id:'countries',pl:'Ogłoszenia bez granic',de:'Anzeigen ohne Grenzen',en:'Find offers near you',uk:'Оголошення без кордонів'},
 {id:'mobile',pl:'Wygodnie na telefonie',de:'Mobilfreundlich',en:'Made for mobile',uk:'Зручно користуватися з телефона'},
 {id:'browse',pl:'Przeglądaj kategorie',de:'Kategorien entdecken',en:'Explore categories',uk:'Переглянути всі категорії'},
 {id:'signup',pl:'Załóż konto',de:'Konto erstellen',en:'Create account',uk:'Зареєструватися'},
 {id:'addTitle',pl:'Dodaj ogłoszenie',de:'Anzeige aufgeben',en:'Post a listing',uk:'Додати оголошення'},
 {id:"find",pl:"Czego szukasz?",de:"Was suchst du?",en:"What are you looking for?",uk:"Що шукаєте?"},
 {id:"account",pl:"Moje konto",de:"Mein Konto",en:"My account",uk:"Мій обліковий запис"},
 {id:"login",pl:"Zaloguj się",de:"Anmelden",en:"Sign in",uk:"Увійти"},
 {id:"listings",pl:"Ogłoszenia",de:"Anzeigen",en:"Listings",uk:"Оголошення"},
 {id:"empty",pl:"Brak ogłoszeń spełniających kryteria.",de:"Keine passenden Anzeigen.",en:"No matching listings.",uk:"Немає оголошень за вибраними критеріями."},
 {id:"logout",pl:"Wyloguj się",de:"Abmelden",en:"Sign out",uk:"Вийти"},
 {id:"mine",pl:"Moje ogłoszenia",de:"Meine Anzeigen",en:"My listings",uk:"Мої оголошення"},
 {id:"city",pl:"Miasto",de:"Stadt",en:"City",uk:"Місто"},
 {id:"description",pl:"Opis",de:"Beschreibung",en:"Description",uk:"Опис"},
 {id:"title",pl:"Tytuł",de:"Titel",en:"Title",uk:"Назва"},
 {id:"price",pl:"Cena",de:"Preis",en:"Price",uk:"Ціна"},
 {id:"publish",pl:"Opublikuj ogłoszenie",de:"Anzeige veröffentlichen",en:"Publish listing",uk:"Опублікувати оголошення"},
 {id:"google",pl:"Kontynuuj przez Google",de:"Mit Google fortfahren",en:"Continue with Google",uk:"Продовжити з Google"},
 {id:"register",pl:"Rejestracja",de:"Registrieren",en:"Register",uk:"Реєстрація"},
 {id:"create",pl:"Utwórz konto",de:"Konto erstellen",en:"Create account",uk:"Створити акаунт"},
 {id:"sample",pl:"Ogłoszenie przykładowe",de:"Beispielanzeige",en:"Sample listing",uk:"Зразок оголошення"}
]);
function normalize(value){return value.normalize('NFKC').toLocaleLowerCase().trim();}
function lookup(text,language){
 if(typeof text!=='string'||!LANGUAGES.includes(language)||!text.trim())return null;
 const value=normalize(text);
 const found=ENTRIES.find(entry=>normalize(entry[language])===value);
 // Some UI labels intentionally coincide (e.g. German Konto erstellen).
 // First matching concept is returned; callers must not infer uniqueness.
 return found?{id:found.id,translations:Object.fromEntries(LANGUAGES.map(lang=>[lang,found[lang]]))}:null;
}
module.exports={LANGUAGES,ENTRIES,lookup};
