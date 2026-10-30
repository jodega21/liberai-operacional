import { redirect } from 'next/navigation';

// Raiz sem conteudo proprio: o app comeca em /leitura. (O proxy ja manda o
// usuario logado para la; isto cobre qualquer caminho que chegue em /.)
export default function Home() {
  redirect('/leitura');
}
