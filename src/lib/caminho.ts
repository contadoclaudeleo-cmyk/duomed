/**
 * Endereço de um arquivo da pasta public/.
 * Funciona também quando o app está publicado numa subpasta, como no
 * GitHub Pages (usuario.github.io/duomed/).
 */
export const arquivoPublico = (caminho: string) => import.meta.env.BASE_URL + caminho.replace(/^\//, '')
