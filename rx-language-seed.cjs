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
 {id:'addTitle',pl:'Dodaj ogłoszenie',de:'Anzeige aufgeben',en:'Post a listing',uk:'Додати оголошення'}
]);
function normalize(value){return value.normalize('NFKC').toLocaleLowerCase().trim();}
function lookup(text,language){
 if(typeof text!=='string'||!LANGUAGES.includes(language)||!text.trim())return null;
 const value=normalize(text);
 const found=ENTRIES.find(entry=>normalize(entry[language])===value);
 return found?{id:found.id,translations:Object.fromEntries(LANGUAGES.map(lang=>[lang,found[lang]]))}:null;
}
module.exports={LANGUAGES,ENTRIES,lookup};
