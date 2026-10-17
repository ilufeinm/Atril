// Diccionario castellano → inglés de Atril, por área. La clave es el texto en castellano tal como está en el código.
// Si una frase no está acá, se muestra en castellano (nunca un texto roto).
import app from './app';
import bandas from './bandas';
import envivo from './envivo';
import premium from './premium';
import perfil from './perfil';
import cuenta from './cuenta';

export default { ...app, ...bandas, ...envivo, ...premium, ...perfil, ...cuenta };
